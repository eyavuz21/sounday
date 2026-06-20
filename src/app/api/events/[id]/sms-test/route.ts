import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/data";
import { sendSms, buildReminderSms } from "@/lib/integrations/twilio";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const event = await prisma.calendarEvent.findUnique({
    where: { id: params.id },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getOrCreateUser();
  if (!user.phone) {
    return NextResponse.json(
      { error: "Add a phone number in Settings first." },
      { status: 400 },
    );
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(req.url).origin;
  const link = `${origin}/event/${event.id}`;

  const time = new Date(event.startDateTime).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const body = buildReminderSms({
    whenLabel: "Test reminder",
    title: `${time} ${event.title}`,
    company: event.company,
    link,
  });

  const result = await sendSms(user.phone, body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    simulated: result.simulated,
    to: user.phone,
    body,
  });
}
