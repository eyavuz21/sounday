import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/data";

/** Disconnect Google: clear tokens and remove synced events (keep seed data). */
export async function POST() {
  const user = await getOrCreateUser();
  await prisma.calendarEvent.deleteMany({
    where: { userId: user.id, source: "google" },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: {
      googleEmail: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
    },
  });
  return NextResponse.json({ ok: true });
}
