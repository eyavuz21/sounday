import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/data";
import {
  exchangeCode,
  fetchUserEmail,
  googleConfigured,
  originFromRequest,
  redirectUri,
} from "@/lib/integrations/google";
import { syncGoogleEvents } from "@/lib/google-sync";

/** OAuth redirect target: exchange the code, store tokens, sync events. */
export async function GET(req: Request) {
  const origin = originFromRequest(req);
  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (error) {
    return NextResponse.redirect(`${origin}/settings?google=denied`);
  }
  if (!googleConfigured() || !code) {
    return NextResponse.redirect(`${origin}/settings?google=error`);
  }

  try {
    const tokens = await exchangeCode(code, redirectUri(req));
    const email = await fetchUserEmail(tokens.accessToken);
    const user = await getOrCreateUser();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleEmail: email,
        googleAccessToken: tokens.accessToken,
        googleRefreshToken: tokens.refreshToken,
        googleTokenExpiry: tokens.expiresAt,
      },
    });

    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    if (fresh) await syncGoogleEvents(fresh);

    return NextResponse.redirect(`${origin}/week?google=connected`);
  } catch (e) {
    console.error("[google] callback error", (e as Error).message);
    return NextResponse.redirect(`${origin}/settings?google=error`);
  }
}
