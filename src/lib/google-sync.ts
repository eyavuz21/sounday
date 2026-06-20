import { prisma } from "./db";
import {
  computeDayLoad,
  detectHighStakes,
  defaultsForEvent,
  reminderTimes,
} from "./stress";
import {
  fetchUpcomingEvents,
  refreshAccessToken,
  type GoogleTokens,
} from "./integrations/google";
import type { Cadence } from "./types";

type GoogleUser = {
  id: string;
  email: string;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: Date | null;
};

/** Return a valid access token, refreshing (and persisting) it if expired. */
async function validAccessToken(user: GoogleUser): Promise<string | null> {
  if (!user.googleAccessToken) return null;
  const stillValid =
    user.googleTokenExpiry &&
    user.googleTokenExpiry.getTime() > Date.now() + 30_000;
  if (stillValid) return user.googleAccessToken;

  if (!user.googleRefreshToken) return user.googleAccessToken;
  const refreshed: GoogleTokens = await refreshAccessToken(
    user.googleRefreshToken,
  );
  await prisma.user.update({
    where: { id: user.id },
    data: {
      googleAccessToken: refreshed.accessToken,
      googleRefreshToken: refreshed.refreshToken,
      googleTokenExpiry: refreshed.expiresAt,
    },
  });
  return refreshed.accessToken;
}

export type SyncResult = { synced: number };

/**
 * Pull the user's upcoming Google Calendar events, run them through the
 * stress-scoring / high-stakes engine, and replace any previously-synced
 * (source="google") events. Seed/demo events are left untouched.
 */
export async function syncGoogleEvents(user: GoogleUser): Promise<SyncResult> {
  const token = await validAccessToken(user);
  if (!token) throw new Error("Google account not connected");

  const events = await fetchUpcomingEvents(token);

  // Day load is computed per calendar day from the synced events.
  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const key = e.startDateTime.toDateString();
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }
  const dayScore = new Map<string, number>();
  for (const [key, evs] of byDay) {
    const load = computeDayLoad(
      evs.map((e) => ({
        title: e.title,
        startDateTime: e.startDateTime,
        durationMinutes: e.durationMinutes,
        contextPurpose: null,
      })),
    );
    dayScore.set(key, load.score);
  }

  // Replace previously-synced Google events (cascade clears their reminders).
  await prisma.calendarEvent.deleteMany({
    where: { userId: user.id, source: "google" },
  });

  for (const e of events) {
    const hs = detectHighStakes(
      {
        title: e.title,
        durationMinutes: e.durationMinutes,
        attendees: e.attendees,
        contextPurpose: null,
        company: e.company,
      },
      user.email,
    );
    const defaults = defaultsForEvent(hs.isHighStakes);
    const created = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: e.title,
        startDateTime: e.startDateTime,
        durationMinutes: e.durationMinutes,
        attendees: JSON.stringify(e.attendees),
        company: e.company,
        isHighStakes: hs.isHighStakes,
        mode: defaults.mode,
        cadence: defaults.cadence,
        stressScore: dayScore.get(e.startDateTime.toDateString()) ?? 0,
        source: "google",
        externalId: e.externalId,
      },
    });

    const times = reminderTimes(e.startDateTime, defaults.cadence as Cadence);
    for (const t of times) {
      await prisma.reminder.create({
        data: { eventId: created.id, sendAt: t.sendAt, label: t.label },
      });
    }
  }

  return { synced: events.length };
}
