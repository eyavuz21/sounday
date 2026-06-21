import type { EventMode } from "../types";
import { modeHasLyrics } from "../modes";

/**
 * Build supportive, confidence-building lyrics for Prime mode from the meeting
 * context — weaving in real themes/topics from the meeting (who they're with,
 * what the company does, the purpose) so the track doubles as gentle prep.
 *
 * Rules:
 * - Second-person and supportive; NEVER narrate the person's own name.
 * - Company info is public/topical only (no personal data about the individual).
 * - Wind-down is instrumental → no lyrics (returns null).
 */

export type LyricContext = {
  who?: string | null;
  what?: string | null;
  purpose?: string | null;
  company?: string | null;
  facts?: string[] | null;
};

const clean = (s?: string | null) => (s ?? "").trim().replace(/\.$/, "");

/** A short, memorable "prep theme" line drawn from the company / facts. */
function prepThemeLines(ctx: LyricContext): string[] {
  const company = clean(ctx.company);
  const what = clean(ctx.what);
  const fact = (ctx.facts ?? []).map(clean).filter(Boolean)[0];
  const lines: string[] = [];

  if (company) {
    lines.push(`Picture ${company}'s road ahead,`);
    lines.push("their five-year plan, and where you fit.");
  } else if (what) {
    lines.push(`You know their world — ${what.toLowerCase()},`);
    lines.push("and where your value fits.");
  }
  if (fact) {
    lines.push(`You've read the room: ${fact.toLowerCase()},`);
    lines.push("so speak to what they need.");
  }
  return lines;
}

export function buildLyrics(
  mode: EventMode,
  ctx: LyricContext,
): string | null {
  if (!modeHasLyrics(mode)) return null;
  return buildPrimeLyrics(ctx);
}

export function buildPrimeLyrics(ctx: LyricContext): string {
  const purpose = clean(ctx.purpose);
  const company = clean(ctx.company);
  const lines: string[] = [];

  lines.push("You've done the work, you know your worth,");
  lines.push("Walk in steady, own the room.");
  if (purpose) {
    lines.push(`You're here to ${purpose.toLowerCase()},`);
    lines.push("and you're more than ready now.");
  } else if (company) {
    lines.push(`You're here to win ${company} over,`);
    lines.push("and you're more than ready now.");
  } else {
    lines.push("Take a breath, the moment's yours,");
    lines.push("and you're more than ready now.");
  }

  const theme = prepThemeLines(ctx);
  if (theme.length) {
    lines.push("");
    lines.push(...theme);
  }

  lines.push("");
  lines.push("Stand tall, speak clear, let it land,");
  lines.push("Every answer's in your hands.");
  lines.push("");
  lines.push("This is your time — rise up, shine,");
  lines.push("You've got this, one breath at a time.");

  return lines.join("\n");
}
