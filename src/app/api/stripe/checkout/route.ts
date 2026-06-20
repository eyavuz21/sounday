import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPrimeCheckout } from "@/lib/integrations/stripe";

export async function POST(req: Request) {
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(req.url).origin;

  // Traction tracking: count the intent-to-pay click.
  await prisma.analyticsEvent.create({ data: { kind: "prime_click" } });

  try {
    const { url, simulated } = await createPrimeCheckout(origin);
    if (simulated) {
      await prisma.analyticsEvent.create({
        data: { kind: "prime_paid", meta: "simulated" },
      });
    }
    return NextResponse.json({ url, simulated });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
