import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEvent, parseAttendees, DEMO_EMAIL } from "@/lib/data";
import {
  detectHighStakes,
  reminderTimes,
  type StressableEvent,
} from "@/lib/stress";
import type { Cadence } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const event = await prisma.calendarEvent.findUnique({
    where: { id: params.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event: serializeEvent(event) });
}

/** Validate a { ready, calm, confident } 1-3 payload into a JSON string (or null). */
function serializeFeeling(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const f = v as Record<string, unknown>;
  const ok = (n: unknown) =>
    typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 3;
  if (ok(f.ready) && ok(f.calm) && ok(f.confident)) {
    return JSON.stringify({
      ready: f.ready,
      calm: f.calm,
      confident: f.confident,
    });
  }
  return null;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.calendarEvent.findUnique({
    where: { id: params.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.mode === "string") data.mode = body.mode;
  if (typeof body.cadence === "string") data.cadence = body.cadence;
  if ("contextWho" in body) data.contextWho = body.contextWho || null;
  if ("contextWhat" in body) data.contextWhat = body.contextWhat || null;
  if ("contextPurpose" in body) data.contextPurpose = body.contextPurpose || null;
  if ("moodBefore" in body)
    data.moodBefore = serializeFeeling(body.moodBefore);
  if ("moodAfter" in body) data.moodAfter = serializeFeeling(body.moodAfter);

  // Recompute high-stakes if context/purpose changed (purpose can flip it).
  const nextPurpose =
    "contextPurpose" in body ? body.contextPurpose : existing.contextPurpose;
  const hs = detectHighStakes(
    {
      title: existing.title,
      durationMinutes: existing.durationMinutes,
      attendees: parseAttendees(existing.attendees),
      contextPurpose: nextPurpose,
      company: existing.company,
    },
    DEMO_EMAIL,
  );
  data.isHighStakes = hs.isHighStakes;

  const updated = await prisma.calendarEvent.update({
    where: { id: params.id },
    data,
  });

  // If cadence changed, regenerate the reminder schedule.
  if (typeof body.cadence === "string" && body.cadence !== existing.cadence) {
    await prisma.reminder.deleteMany({ where: { eventId: params.id } });
    const times = reminderTimes(
      updated.startDateTime,
      body.cadence as Cadence,
    );
    for (const t of times) {
      await prisma.reminder.create({
        data: { eventId: params.id, sendAt: t.sendAt, label: t.label },
      });
    }
  }

  return NextResponse.json({
    event: serializeEvent(updated),
    highStakesReasons: hs.reasons,
  });
}

export type StressableExport = StressableEvent;
