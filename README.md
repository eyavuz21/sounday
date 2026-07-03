# Sounday

**Your calendar, turned into a personal soundtrack.**

**🔴 Live demo: <https://sounday-piqy.onrender.com> — pre-seeded with a demo week, no login needed.** (Free-tier hosting: first load after idle can take ~30s to wake.)

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
- Integrations: **ElevenLabs Music** (AI track generation), **Cala** (company
  enrichment), **Vapi** (voice input), **Google Calendar** (auto-import schedule),
  **Spotify** (taste/style hint), **Twilio** (SMS), **Stripe** (€1 Prime unlock)

Every external integration degrades gracefully: with no API key the app falls
back to mood-matched sample tracks / simulated SMS / on-device voice so the demo
never breaks. Music generation is provider-agnostic (ElevenLabs → Suno →
Replicate → Spotify → sample) and switches on the moment a key is present.

## Pages

| Route | What it is |
|-------|------------|
| `/` | Landing — hero, waitlist + live signup counter, "Unlock Prime — €1" |
| `/onboarding` | 3-step setup (phone + music taste, by text or voice) |
| `/week` | Week dashboard — stress curve + days with events & badges |
| `/event/[id]` | Event detail — context card, generate, mode, cadence, player |
| `/settings` | Phone, notification prefs, music taste, **Connect Google Calendar** |

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
| A | **ElevenLabs Music** (+ Suno/Replicate) | `src/lib/integrations/elevenlabs.ts` | mood-matched Spotify / sample track per mode |
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

## Google Calendar connect

Settings → **Connect Google Calendar** runs an OAuth flow (`calendar.readonly`)
and imports your upcoming events, running them through the same stress-scoring +
high-stakes engine. Synced events are tagged `source="google"` and live alongside
the seed demo week; **Sync now** / **Disconnect** manage them. Routes live under
`src/app/api/google/*`; the OAuth redirect URI is derived from the request origin
so it works on localhost and on the deployed domain.

> While the Google Cloud app is in "testing", only emails added as **Test users**
> on the OAuth consent screen can connect.

## Deploy (Render)

The repo ships a [`render.yaml`](./render.yaml) blueprint:

1. Render Dashboard → **New → Blueprint** → pick the `hodoea/sounday` repo.
2. In the service's **Environment** tab, set the API keys (see `.env.example`).
3. Deploy. Every push to the connected branch then **auto-deploys**.
4. Add `https://<your-app>.onrender.com/api/google/callback` to your Google OAuth
   client's **Authorized redirect URIs**.

The free tier sleeps after ~15 min idle and its disk resets on redeploy (the
build re-seeds the demo week each time). Add a Render Disk or upgrade the plan
for a persistent database.

## Secrets

All keys live in `.env` (gitignored) — see `.env.example`. Nothing is hardcoded;
the public Vapi key is the only value exposed to the browser (via `/api/config`).

## Data models (`prisma/schema.prisma`)

`User` (email, phone, notifPrefs, musicTaste) · `CalendarEvent` (title, start,
duration, attendees, company, isHighStakes, mode, cadence, stressScore, context,
trackUrl, lyrics) · `Reminder` · `WaitlistSignup` · `AnalyticsEvent` (traction).

## Credits

Built at the Megathon (Amsterdam) by [Emre Yavuz](https://github.com/eyavuz21)
and [Hodo Elmi Aden](https://github.com/hodoea).
