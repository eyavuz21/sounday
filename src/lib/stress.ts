import type { Attendee, Cadence, EventMode, Mood } from "./types";

export const PRESSURE_KEYWORDS = [
  "deadline",
  "due",
  "review",
  "pitch",
  "interview",
  "board",
  "presentation",
];

export const HIGH_STAKES_KEYWORDS = [
  "pitch",
  "interview",
  "board",
  "client",
  "ceo",
  "investor",
  "review",
  "presentation",
];

export function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).toLowerCase().trim();
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export type StressableEvent = {
  title: string;
  startDateTime: Date;
  durationMinutes: number;
  contextPurpose?: string | null;
};

export type StressBreakdown = {
  score: number;
  meetingsCount: number;
  totalHours: number;
  backToBack: number;
  earlyStart: boolean;
  keywordHits: number;
  littleFreeTime: boolean;
};

/**
 * Compute a daily load score (0-100) from a day's events.
 * Features: # meetings, total hours, back-to-back count (gap < 15min),
 * early start (<9am), pressure keywords, little free time between meetings.
 */
export function computeDayLoad(events: StressableEvent[]): StressBreakdown {
  const empty: StressBreakdown = {
    score: 0,
    meetingsCount: 0,
    totalHours: 0,
    backToBack: 0,
    earlyStart: false,
    keywordHits: 0,
    littleFreeTime: false,
  };
  if (events.length === 0) return empty;

  const sorted = [...events].sort(
    (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime(),
  );

  const meetingsCount = sorted.length;
  const totalMinutes = sorted.reduce((s, e) => s + e.durationMinutes, 0);
  const totalHours = totalMinutes / 60;

  let backToBack = 0;
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd =
      sorted[i - 1].startDateTime.getTime() +
      sorted[i - 1].durationMinutes * 60_000;
    const gapMin = (sorted[i].startDateTime.getTime() - prevEnd) / 60_000;
    gaps.push(gapMin);
    if (gapMin < 15) backToBack += 1;
  }

  const earlyStart = sorted.some((e) => e.startDateTime.getHours() < 9);

  let keywordHits = 0;
  for (const e of sorted) {
    const hay = `${e.title} ${e.contextPurpose ?? ""}`.toLowerCase();
    for (const kw of PRESSURE_KEYWORDS) {
      if (hay.includes(kw)) keywordHits += 1;
    }
  }

  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 999;
  const littleFreeTime = gaps.length > 0 && avgGap < 30;

  let score = 0;
  score += Math.min(meetingsCount * 9, 36); // up to 36 for sheer count
  score += Math.min(totalHours * 7, 28); // up to 28 for hours
  score += Math.min(backToBack * 9, 27); // up to 27 for crammed schedule
  score += earlyStart ? 10 : 0;
  score += Math.min(keywordHits * 7, 21); // pressure keywords
  score += littleFreeTime ? 8 : 0;

  return {
    score: Math.round(clamp(score)),
    meetingsCount,
    totalHours: Math.round(totalHours * 10) / 10,
    backToBack,
    earlyStart,
    keywordHits,
    littleFreeTime,
  };
}

/** Day-level suggestion: high load -> wind down. */
export function suggestDayMode(score: number): EventMode {
  return score >= 60 ? "winddown" : "prime";
}

/** Map a load score to musical mood parameters (calming as load rises). */
export function moodFromScore(score: number): Mood {
  const energy = Math.round((0.55 - (score / 100) * 0.35) * 100) / 100; // higher load -> calmer
  const valence = Math.round((0.45 + (score / 100) * 0.25) * 100) / 100; // soothing/positive
  return {
    energy,
    valence,
    label: score >= 60 ? "calm" : "balanced",
  };
}

/** Mood targets per generation mode (always respected, taste is only a hint). */
export function moodForMode(mode: EventMode): Mood {
  if (mode === "prime") {
    return { energy: 0.85, valence: 0.8, label: "confident" };
  }
  return { energy: 0.22, valence: 0.55, label: "calm" };
}

export type HighStakesInput = {
  title: string;
  durationMinutes: number;
  attendees: Attendee[];
  contextPurpose?: string | null;
  company?: string | null;
};

export type HighStakesResult = {
  isHighStakes: boolean;
  reasons: string[];
};

/**
 * Flag an event as high-stakes if:
 *  - it has an external attendee (domain differs from the user's), OR
 *  - title/purpose contains a high-stakes keyword, OR
 *  - it is long (>60 min).
 */
export function detectHighStakes(
  ev: HighStakesInput,
  userEmail: string,
): HighStakesResult {
  const reasons: string[] = [];
  const userDomain = emailDomain(userEmail);

  const external = ev.attendees.filter(
    (a) => a.email && emailDomain(a.email) && emailDomain(a.email) !== userDomain,
  );
  if (external.length > 0) {
    reasons.push(
      `External attendee (${external.map((a) => emailDomain(a.email)).join(", ")})`,
    );
  }

  const hay = `${ev.title} ${ev.contextPurpose ?? ""} ${ev.company ?? ""}`.toLowerCase();
  const matched = HIGH_STAKES_KEYWORDS.filter((kw) => hay.includes(kw));
  if (matched.length > 0) reasons.push(`Keyword: ${matched.join(", ")}`);

  if (ev.durationMinutes > 60) reasons.push("Long meeting (>60 min)");

  return { isHighStakes: reasons.length > 0, reasons };
}

/** Defaults derived from high-stakes status. */
export function defaultsForEvent(isHighStakes: boolean): {
  mode: EventMode;
  cadence: Cadence;
} {
  return isHighStakes
    ? { mode: "prime", cadence: "full" }
    : { mode: "winddown", cadence: "none" };
}

/** Compute reminder send-times for a cadence relative to event start. */
export function reminderTimes(
  start: Date,
  cadence: Cadence,
): { sendAt: Date; label: string }[] {
  const out: { sendAt: Date; label: string }[] = [];
  const fifteenBefore = new Date(start.getTime() - 15 * 60_000);

  const nightBefore = new Date(start);
  nightBefore.setDate(nightBefore.getDate() - 1);
  nightBefore.setHours(21, 0, 0, 0);

  const morningOf = new Date(start);
  morningOf.setHours(8, 0, 0, 0);

  if (cadence === "once") {
    out.push({ sendAt: fifteenBefore, label: "15 min before" });
  } else if (cadence === "standard") {
    out.push({ sendAt: nightBefore, label: "Night before (9pm)" });
    out.push({ sendAt: fifteenBefore, label: "15 min before" });
  } else if (cadence === "full") {
    out.push({ sendAt: nightBefore, label: "Night before (9pm)" });
    out.push({ sendAt: morningOf, label: "Morning of (8am)" });
    out.push({ sendAt: fifteenBefore, label: "15 min before" });
  }
  return out;
}
