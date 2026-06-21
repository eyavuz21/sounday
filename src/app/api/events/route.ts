import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser, serializeEvent, DEMO_EMAIL } from "@/lib/data";
import {
  computeDayLoad,
  detectHighStakes,
  defaultsForEvent,
  reminderTimes,
} from "@/lib/stress";
import type { Attendee, Cadence } from "@/lib/types";

const MAX_TITLE = 140;

/**
 * Create an event manually (no Google connection needed). Runs the same
 * stress-scoring / high-stakes engine as the Google sync, stores it with
 * source="manual" (so a later Google re-sync won't wipe it), and recomputes
 * the day's load across all events on that day.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : ""; // yyyy-mm-dd
  const time = typeof body.time === "string" ? body.time.trim() : ""; // HH:mm
  if (!title || title.length > MAX_TITLE)
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    return NextResponse.json(
      { error: "Valid date and time are required" },
      { status: 400 },
    );

  const startDateTime = new Date(`${date}T${time}`);
  if (Number.isNaN(startDateTime.getTime()))
    return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });

  const durationMinutes =
    Number.isFinite(body.durationMinutes) && body.durationMinutes > 0
      ? Math.min(Math.round(body.durationMinutes), 600)
      : 30;

  const company =
    typeof body.company === "string" && body.company.trim()
      ? body.company.trim()
      : null;
  const contextPurpose =
    typeof body.contextPurpose === "string" && body.contextPurpose.trim()
      ? body.contextPurpose.trim()
      : null;

  const attendees: Attendee[] = [];
  const aName = typeof body.attendeeName === "string" ? body.attendeeName.trim() : "";
  const aEmail = typeof body.attendeeEmail === "string" ? body.attendeeEmail.trim() : "";
  if (aName || aEmail) attendees.push({ name: aName, email: aEmail });

  const user = await getOrCreateUser();

  const hs = detectHighStakes(
    { title, durationMinutes, attendees, contextPurpose, company },
    DEMO_EMAIL,
  );
  const defaults = defaultsForEvent(hs.isHighStakes);

  const created = await prisma.calendarEvent.create({
    data: {
      userId: user.id,
      title,
      startDateTime,
      durationMinutes,
      attendees: JSON.stringify(attendees),
      company,
      contextPurpose,
      isHighStakes: hs.isHighStakes,
      mode: defaults.mode,
      cadence: defaults.cadence,
      stressScore: 0,
      source: "manual",
    },
  });

  // Recompute that day's load across every event on the day (incl. the new one)
  // and persist it so generation uses an up-to-date score.
  await recomputeDayLoad(user.id, startDateTime);

  const times = reminderTimes(startDateTime, defaults.cadence as Cadence);
  for (const t of times) {
    await prisma.reminder.create({
      data: { eventId: created.id, sendAt: t.sendAt, label: t.label },
    });
  }

  const fresh = await prisma.calendarEvent.findUnique({
    where: { id: created.id },
  });

  return NextResponse.json({
    event: serializeEvent(fresh!),
    highStakesReasons: hs.reasons,
  });
}

/** Recompute and persist the shared day-load score for every event on a day. */
async function recomputeDayLoad(userId: string, onDate: Date) {
  const dayStart = new Date(onDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const dayEvents = await prisma.calendarEvent.findMany({
    where: { userId, startDateTime: { gte: dayStart, lt: dayEnd } },
  });
  if (dayEvents.length === 0) return;

  const load = computeDayLoad(
    dayEvents.map((e) => ({
      title: e.title,
      startDateTime: e.startDateTime,
      durationMinutes: e.durationMinutes,
      contextPurpose: e.contextPurpose,
    })),
  );

  await prisma.calendarEvent.updateMany({
    where: { id: { in: dayEvents.map((e) => e.id) } },
    data: { stressScore: load.score },
  });
}
