import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/data";
import { syncGoogleEvents } from "@/lib/google-sync";

/** Re-sync the connected Google Calendar using stored tokens. */
export async function POST() {
  const user = await getOrCreateUser();
  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fresh?.googleAccessToken) {
    return NextResponse.json(
      { error: "Google account not connected" },
      { status: 400 },
    );
  }
  try {
    const result = await syncGoogleEvents(fresh);
    return NextResponse.json({ ok: true, synced: result.synced });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 502 },
    );
  }
}
