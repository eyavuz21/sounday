import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser, parseMusicTaste } from "@/lib/data";
import { generateMusic } from "@/lib/integrations/music";
import { artistsFromPlaylist } from "@/lib/integrations/spotify";
import { buildLyrics } from "@/lib/integrations/lyrics";
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
  // Pull loose style influences from the user's linked Spotify playlist (their
  // favourite/most-listened artists), then merge with any typed taste. Falls
  // back to taste alone when Spotify can't be read.
  const playlistArtists = await artistsFromPlaylist(user.spotifyPlaylist);
  const styleTerms = [...new Set([...playlistArtists, ...taste])].slice(0, 6);
  const styleHint = styleTerms.length ? styleTerms.join(", ") : null;

  // Prime mode: supportive, meeting-themed affirmation lyrics. Wind-down: none.
  const lyrics = buildLyrics(mode, {
    who: event.contextWho,
    what: event.contextWhat,
    purpose: event.contextPurpose,
    company: event.company,
  });

  // The event's day load drives the acoustic parameters (tempo/timbre/surprise…).
  const result = await generateMusic({
    mode,
    dayLoad: event.stressScore,
    styleHint,
    lyrics,
  });

  const updated = await prisma.calendarEvent.update({
    where: { id: params.id },
    data: { mode, trackUrl: result.trackUrl, lyrics },
  });

  await prisma.analyticsEvent.create({
    data: { kind: "track_generated", meta: `${mode}:${result.provider}` },
  });

  return NextResponse.json({
    trackUrl: updated.trackUrl,
    lyrics: updated.lyrics,
    title: result.title,
    provider: result.provider,
    kind: result.kind,
    acoustics: result.acoustics,
    note: result.note ?? null,
    styleHint,
  });
}
