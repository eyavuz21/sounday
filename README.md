# Sounday

**Your calendar, turned into a personal soundtrack.**

Calm tracks when you're overloaded, a confidence-priming hype song before
high-stakes meetings — pinged to your phone right when you need it.

Sounday is a mobile-first web app that reads your week, scores each day's stress,
flags your high-stakes moments, and generates a mood-matched track for every
meeting (calm "Wind-down" or confident "Prime"). Prep tracks are scheduled to
your phone via SMS on a cadence you choose.

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — serene blue/teal, mobile-first, large tap targets
- **Prisma + SQLite** — local, zero-config datastore
- Integrations: **Suno** (music), **Cala** (company enrichment), **Vapi**
  (voice input), **Twilio** (SMS), **Stripe** (€1 Prime unlock)

Every external integration degrades gracefully: with no API key the app falls
back to sample tracks / simulated SMS / on-device voice so the demo never breaks.

## Pages

| Route | What it is |
|-------|------------|
| `/` | Landing — hero, waitlist + live signup counter, "Unlock Prime — €1" |
| `/onboarding` | 3-step setup (phone + music taste, by text or voice) |
| `/week` | Week dashboard — stress curve + days with events & badges |
| `/event/[id]` | Event detail — context card, generate, mode, cadence, player |
| `/settings` | Phone, notification prefs, music taste |

## Getting started

```bash
npm install
cp .env.example .env       # set DATABASE_URL (already defaulted)
npm run db:push            # create the SQLite schema
npm run db:seed            # seed the demo week (incl. the NorthStar pitch)
npm run dev                # http://localhost:3000
```

## Stress scoring (`src/lib/stress.ts`)

`computeDayLoad()` produces a 0–100 daily load score from:

- number of meetings
- total meeting hours
- back-to-back meetings (gap < 15 min)
- early start (before 9am)
- pressure keywords in titles (`deadline, due, review, pitch, interview, board, presentation`)
- little free time between meetings

The score maps to musical mood (`moodFromScore`) — **higher load ⇒ calmer
energy** — and a high day score suggests **Wind-down** mode.

## High-stakes detection (`detectHighStakes`)

An event is high-stakes if **any** of:

- it has an **external attendee** (email domain ≠ the user's), or
- the title/purpose contains `pitch, interview, board, client, CEO, investor,
  review, presentation`, or
- it is **long** (> 60 min).

High-stakes events default to **Prime** mode + **Full prep** cadence; routine
events get no reminders.

## Part 2 integrations — and where real services plug in

| Letter | Service | File | Fallback |
|--------|---------|------|----------|
| A | **Suno** music | `src/lib/integrations/suno.ts` | sample WAV per mode |
| B | **Cala** company facts | `src/lib/integrations/cala.ts` | no facts, manual entry |
| C | **Vapi** voice input | `src/components/event/VoiceCapture.tsx` | on-device Web Speech |
| D | **Twilio** SMS | `src/lib/integrations/twilio.ts` | simulated send |
| E | **Stripe** €1 unlock | `src/lib/integrations/stripe.ts` | simulated success URL |

- **Prime lyrics** are built in `src/lib/integrations/lyrics.ts` — supportive,
  confidence-building, second-person (never narrates the person's name).
  **Wind-down** generates calm instrumental (no lyrics).
- **Music taste** (Settings/onboarding) is passed as a *style hint* to
  generation while the mode's target mood is always preserved (genres preferred
  over artists).
- **SMS scheduling**: cadence → reminder rows (`reminderTimes`). A worker hits
  `POST /api/cron/send-reminders` to dispatch due reminders (wire to Vercel Cron
  or any scheduler in production).

## Secrets

All keys live in `.env` (gitignored) — see `.env.example`. Nothing is hardcoded;
the public Vapi key is the only value exposed to the browser (via `/api/config`).

## Data models (`prisma/schema.prisma`)

`User` (email, phone, notifPrefs, musicTaste) · `CalendarEvent` (title, start,
duration, attendees, company, isHighStakes, mode, cadence, stressScore, context,
trackUrl, lyrics) · `Reminder` · `WaitlistSignup` · `AnalyticsEvent` (traction).
