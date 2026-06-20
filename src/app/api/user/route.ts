import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getOrCreateUser,
  parseMusicTaste,
  parseNotifPrefs,
} from "@/lib/data";

export async function GET() {
  const user = await getOrCreateUser();
  return NextResponse.json({
    email: user.email,
    phone: user.phone,
    musicTaste: parseMusicTaste(user.musicTaste),
    spotifyPlaylist: user.spotifyPlaylist,
    notifPrefs: parseNotifPrefs(user.notifPrefs),
    onboarded: user.onboarded,
    primeUnlocked: user.primeUnlocked,
  });
}

export async function PATCH(req: Request) {
  const user = await getOrCreateUser();
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if ("phone" in body) data.phone = body.phone ? String(body.phone) : null;
  if ("spotifyPlaylist" in body)
    data.spotifyPlaylist = body.spotifyPlaylist
      ? String(body.spotifyPlaylist).trim()
      : null;
  if ("onboarded" in body) data.onboarded = Boolean(body.onboarded);
  if (Array.isArray(body.musicTaste)) {
    const taste = body.musicTaste
      .map((s: unknown) => String(s).trim())
      .filter(Boolean)
      .slice(0, 5);
    data.musicTaste = JSON.stringify(taste);
  }
  if (body.notifPrefs && typeof body.notifPrefs === "object") {
    const p = body.notifPrefs;
    data.notifPrefs = JSON.stringify({
      sms: Boolean(p.sms),
      beforeMeeting: Boolean(p.beforeMeeting),
      nightBefore: Boolean(p.nightBefore),
      morningOf: Boolean(p.morningOf),
    });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
  });

  return NextResponse.json({
    email: updated.email,
    phone: updated.phone,
    musicTaste: parseMusicTaste(updated.musicTaste),
    spotifyPlaylist: updated.spotifyPlaylist,
    notifPrefs: parseNotifPrefs(updated.notifPrefs),
    onboarded: updated.onboarded,
  });
}
