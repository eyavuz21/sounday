import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function GET() {
  const count = await prisma.waitlistSignup.count();
  return NextResponse.json({ count });
}

export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  await prisma.waitlistSignup.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const count = await prisma.waitlistSignup.count();
  return NextResponse.json({ ok: true, count });
}
