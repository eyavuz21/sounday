import { prisma } from "./db";
import type { Attendee, Cadence, EventMode, NotifPrefs } from "./types";

export const DEMO_EMAIL = "emre@sounday.app";

export async function getOrCreateUser() {
  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL },
  });
}

export type SerializedEvent = {
  id: string;
  title: string;
  startISO: string;
  durationMinutes: number;
  attendees: Attendee[];
  company: string | null;
  isHighStakes: boolean;
  mode: EventMode;
  cadence: Cadence;
  stressScore: number;
  contextWho: string | null;
  contextWhat: string | null;
  contextPurpose: string | null;
  trackUrl: string | null;
  lyrics: string | null;
};

type RawEvent = {
  id: string;
  title: string;
  startDateTime: Date;
  durationMinutes: number;
  attendees: string;
  company: string | null;
  isHighStakes: boolean;
  mode: string;
  cadence: string;
  stressScore: number;
  contextWho: string | null;
  contextWhat: string | null;
  contextPurpose: string | null;
  trackUrl: string | null;
  lyrics: string | null;
};

export function parseAttendees(json: string): Attendee[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function serializeEvent(e: RawEvent): SerializedEvent {
  return {
    id: e.id,
    title: e.title,
    startISO: e.startDateTime.toISOString(),
    durationMinutes: e.durationMinutes,
    attendees: parseAttendees(e.attendees),
    company: e.company,
    isHighStakes: e.isHighStakes,
    mode: (e.mode as EventMode) ?? "winddown",
    cadence: (e.cadence as Cadence) ?? "none",
    stressScore: e.stressScore,
    contextWho: e.contextWho,
    contextWhat: e.contextWhat,
    contextPurpose: e.contextPurpose,
    trackUrl: e.trackUrl,
    lyrics: e.lyrics,
  };
}

export async function getWeekEvents(userId: string): Promise<SerializedEvent[]> {
  const events = await prisma.calendarEvent.findMany({
    where: { userId },
    orderBy: { startDateTime: "asc" },
  });
  return events.map(serializeEvent);
}

export function parseMusicTaste(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function parseNotifPrefs(json: string): NotifPrefs {
  try {
    const v = JSON.parse(json);
    return {
      sms: Boolean(v.sms),
      beforeMeeting: Boolean(v.beforeMeeting),
      nightBefore: Boolean(v.nightBefore),
      morningOf: Boolean(v.morningOf),
    };
  } catch {
    return { sms: true, beforeMeeting: true, nightBefore: true, morningOf: true };
  }
}
