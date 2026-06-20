import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser, parseMusicTaste } from "@/lib/data";
import { generateTrack } from "@/lib/integrations/suno";
import { buildPrimeLyrics } from "@/lib/integrations/lyrics";
import type { EventMode } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const event = await prisma.calendarEvent.findUnique({
    where: { id: params.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const mode: EventMode = (body.mode as EventMode) ?? (event.mode as EventMode);

  const user = await getOrCreateUser();
  const taste = parseMusicTaste(user.musicTaste);
  const styleHint = taste.length ? taste.join(", ") : null;

  // Prime mode: supportive, confidence-building lyrics from the meeting context.
  let lyrics: string | null = null;
  if (mode === "prime") {
    lyrics = buildPrimeLyrics({
      who: event.contextWho,
      what: event.contextWhat,
      purpose: event.contextPurpose,
    });
  }

  const result = await generateTrack({
    mode,
    styleHint,
    lyrics,
    contextWhat: event.contextWhat,
    company: event.company,
  });

  const updated = await prisma.calendarEvent.update({
    where: { id: params.id },
    data: {
      mode,
      trackUrl: result.url,
      lyrics: result.lyrics ?? lyrics,
    },
  });

  await prisma.analyticsEvent.create({
    data: { kind: "track_generated", meta: `${mode}:${result.source}` },
  });

  return NextResponse.json({
    trackUrl: updated.trackUrl,
    lyrics: updated.lyrics,
    title: result.title,
    source: result.source,
    note: result.note ?? null,
    styleHint,
  });
}
