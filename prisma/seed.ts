import { PrismaClient } from "@prisma/client";
import {
  computeDayLoad,
  detectHighStakes,
  defaultsForEvent,
  reminderTimes,
} from "../src/lib/stress";
import type { Attendee, Cadence } from "../src/lib/types";

const prisma = new PrismaClient();

const USER_EMAIL = "emre@sounday.app";
const USER_DOMAIN = "sounday.app";

function internal(name: string): Attendee {
  const handle = name.toLowerCase().split(" ")[0];
  return { name, email: `${handle}@${USER_DOMAIN}` };
}

/** Monday of the upcoming (or current) week, at midnight local time. */
function upcomingMonday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (1 - day + 7) % 7; // days until next Monday (0 if today is Monday)
  d.setDate(d.getDate() + diff);
  return d;
}

function at(base: Date, addDays: number, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, minute, 0, 0);
  return d;
}

type SeedEvent = {
  title: string;
  start: Date;
  durationMinutes: number;
  attendees: Attendee[];
  company?: string;
  contextWho?: string;
  contextWhat?: string;
  contextPurpose?: string;
};

async function main() {
  const monday = upcomingMonday();

  const user = await prisma.user.upsert({
    where: { email: USER_EMAIL },
    update: {},
    create: {
      email: USER_EMAIL,
      phone: null,
      musicTaste: JSON.stringify([]),
      onboarded: false,
    },
  });

  // Clear existing events for a clean reseed.
  await prisma.calendarEvent.deleteMany({ where: { userId: user.id } });

  const events: SeedEvent[] = [
    // Monday — light
    {
      title: "Team standup",
      start: at(monday, 0, 9, 30),
      durationMinutes: 30,
      attendees: [internal("Priya Patel"), internal("Tom Lee")],
    },
    {
      title: "1:1 with manager",
      start: at(monday, 0, 11, 0),
      durationMinutes: 30,
      attendees: [internal("Dana Cole")],
    },

    // Tuesday — the marquee pitch
    {
      title: "Team standup",
      start: at(monday, 1, 10, 0),
      durationMinutes: 30,
      attendees: [internal("Priya Patel")],
    },
    {
      title: "Pitch to CEO of NorthStar Robotics",
      start: at(monday, 1, 14, 0),
      durationMinutes: 60,
      attendees: [
        { name: "Alex Mercer", email: "alex.mercer@northstarrobotics.com" },
        internal("Priya Patel"),
      ],
      company: "NorthStar Robotics",
      contextWho: "Alex Mercer, CEO & co-founder",
      contextPurpose: "win a paid pilot for our scheduling product",
    },
    {
      title: "Pitch review & debrief",
      start: at(monday, 1, 16, 0),
      durationMinutes: 30,
      attendees: [internal("Dana Cole")],
    },

    // Wednesday — VERY packed, early start, back-to-back
    {
      title: "Early EU sync",
      start: at(monday, 2, 8, 0),
      durationMinutes: 30,
      attendees: [internal("Lars Berg")],
    },
    {
      title: "Sprint planning",
      start: at(monday, 2, 8, 30),
      durationMinutes: 60,
      attendees: [internal("Tom Lee"), internal("Priya Patel")],
    },
    {
      title: "Design review",
      start: at(monday, 2, 9, 30),
      durationMinutes: 60,
      attendees: [internal("Maya Singh")],
    },
    {
      title: "Client check-in",
      start: at(monday, 2, 10, 30),
      durationMinutes: 45,
      attendees: [
        { name: "Jordan Fox", email: "jordan@brightwave.io" },
        internal("Dana Cole"),
      ],
      company: "Brightwave",
    },
    {
      title: "Roadmap presentation",
      start: at(monday, 2, 13, 0),
      durationMinutes: 60,
      attendees: [internal("Dana Cole"), internal("Tom Lee")],
    },
    {
      title: "Interview candidate (Senior Eng)",
      start: at(monday, 2, 15, 0),
      durationMinutes: 45,
      attendees: [{ name: "Sam Rivera", email: "sam.rivera@gmail.com" }],
    },

    // Thursday — medium
    {
      title: "Board prep",
      start: at(monday, 3, 11, 0),
      durationMinutes: 60,
      attendees: [internal("Dana Cole")],
    },
    {
      title: "Coffee chat",
      start: at(monday, 3, 15, 0),
      durationMinutes: 30,
      attendees: [internal("Maya Singh")],
    },

    // Friday — light + one external investor call
    {
      title: "Weekly retro",
      start: at(monday, 4, 10, 0),
      durationMinutes: 45,
      attendees: [internal("Priya Patel"), internal("Tom Lee")],
    },
    {
      title: "Investor update call",
      start: at(monday, 4, 16, 0),
      durationMinutes: 30,
      attendees: [
        { name: "Riya Kapoor", email: "riya@summitventures.vc" },
      ],
      company: "Summit Ventures",
    },
  ];

  // Group by day index for stress scoring.
  const byDay = new Map<string, SeedEvent[]>();
  for (const e of events) {
    const key = e.start.toDateString();
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }
  const dayScore = new Map<string, number>();
  for (const [key, evs] of byDay) {
    const load = computeDayLoad(
      evs.map((e) => ({
        title: e.title,
        startDateTime: e.start,
        durationMinutes: e.durationMinutes,
        contextPurpose: e.contextPurpose ?? null,
      })),
    );
    dayScore.set(key, load.score);
  }

  for (const e of events) {
    const hs = detectHighStakes(
      {
        title: e.title,
        durationMinutes: e.durationMinutes,
        attendees: e.attendees,
        contextPurpose: e.contextPurpose ?? null,
        company: e.company ?? null,
      },
      USER_EMAIL,
    );
    const defaults = defaultsForEvent(hs.isHighStakes);
    const created = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: e.title,
        startDateTime: e.start,
        durationMinutes: e.durationMinutes,
        attendees: JSON.stringify(e.attendees),
        company: e.company ?? null,
        isHighStakes: hs.isHighStakes,
        mode: defaults.mode,
        cadence: defaults.cadence,
        stressScore: dayScore.get(e.start.toDateString()) ?? 0,
        contextWho: e.contextWho ?? null,
        contextWhat: e.contextWhat ?? null,
        contextPurpose: e.contextPurpose ?? null,
      },
    });

    // Pre-create reminders matching the default cadence.
    const times = reminderTimes(e.start, defaults.cadence as Cadence);
    for (const t of times) {
      await prisma.reminder.create({
        data: {
          eventId: created.id,
          sendAt: t.sendAt,
          label: t.label,
        },
      });
    }
  }

  const count = await prisma.calendarEvent.count({ where: { userId: user.id } });
  console.log(`Seeded user ${user.email} with ${count} events.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
