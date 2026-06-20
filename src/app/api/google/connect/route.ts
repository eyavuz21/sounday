import { NextResponse } from "next/server";
import { authUrl, googleConfigured, redirectUri } from "@/lib/integrations/google";

/** Kick off the Google OAuth consent flow. */
export async function GET(req: Request) {
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar is not configured (missing OAuth credentials)." },
      { status: 503 },
    );
  }
  const redirect = redirectUri(req);
  return NextResponse.redirect(authUrl(redirect));
}
