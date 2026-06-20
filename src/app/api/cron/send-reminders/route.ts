import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser, parseNotifPrefs } from "@/lib/data";
import { sendSms, buildReminderSms } from "@/lib/integrations/twilio";

/**
 * Sends any reminders that are now due.
 *
 * In production this is invoked by a scheduler (e.g. Vercel Cron / a worker)
 * every few minutes. It finds scheduled reminders whose sendAt has passed,
 * sends the SMS with a deep link to the event's track, and marks them sent.
 */
export async function POST(req: Request) {
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(req.url).origin;

  const user = await getOrCreateUser();
  const prefs = parseNotifPrefs(user.notifPrefs);
  if (!user.phone || !prefs.sms) {
    return NextResponse.json({ sent: 0, reason: "SMS disabled or no phone" });
  }

  const due = await prisma.reminder.findMany({
    where: { status: "scheduled", sendAt: { lte: new Date() } },
    include: { event: true },
    take: 50,
  });

  let sent = 0;
  for (const r of due) {
    const time = new Date(r.event.startDateTime).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    const body = buildReminderSms({
      whenLabel: r.label,
      title: `${time} ${r.event.title}`,
      company: r.event.company,
      link: `${origin}/event/${r.event.id}`,
    });
    const res = await sendSms(user.phone, body);
    await prisma.reminder.update({
      where: { id: r.id },
      data: { status: res.ok ? "sent" : "failed" },
    });
    if (res.ok) sent += 1;
  }

  return NextResponse.json({ sent, considered: due.length });
}

export async function GET(req: Request) {
  return POST(req);
}
