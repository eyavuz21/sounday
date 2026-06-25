# Base44 build prompt — Sounday

Paste the block below into Base44. It describes Sounday exactly as built, so Base44 reproduces the same app, modes, and behaviour.

---

Build **Sounday**, a mobile-first web app that turns a person's calendar into mood-matched soundtracks. Aesthetic: calm, premium, dark aurora-green (`#08251c` background, amber `#E8A92E` + teal/green gradient accents), Inter for UI + Newsreader serif for headlines, generous rounded cards (24px radius), soft shadows. Bottom tab nav on mobile.

## Core idea
For each calendar event, Sounday infers the day's stress **load** and lets the user pick a **soundtrack mode**, then generates a short bespoke track tuned to that event — calm when the day is overloaded, confidence-priming before high-stakes meetings. Before and after listening it asks how the user feels and calibrates the music to move them toward a better state. Events come from a Google Calendar sync **or** are added by hand, so the whole app is usable with no account connected.

## Pages
1. **Landing (`/`)** — aurora hero with giant "SOUNDAY" wordmark. Hero subline: *"Your calendar, turned into a personal soundtrack — calm tracks when you're overloaded, a confidence-priming hype song before the big meetings, pinged to your phone right when you need it."* Sections: How it works (3 steps), Sunday preview (framed "coming soon"), the five moods, a testimonial, and an early-access email capture wired to a real waitlist. Integrations line must say **"Google Calendar · Apple & Outlook soon"** (only Google is built). Privacy line: **"We only use your event times & titles — never shared."** The hero may show a small vertical (rotated) meta label on the right edge — keep this to **"© 2026" only** (do **not** add a day/time label such as "SUN 18:00").
2. **Week (`/week`)** — the week as a vertical list of days; each event row shows time, title, attendees, a **stress score**, and tags (e.g. "High-stakes", plus the mode). A stress curve across the top. Works with no login (seeded demo data). Includes an **"+ Add an event"** control (see below) so users can add meetings manually without connecting a calendar.
3. **Event detail (`/event/[id]`)** — the heart of the app (see below).
4. **Settings (`/settings`)** — music taste field, "Connect Google Calendar" (OAuth), and a "Link a Spotify playlist" field marked **"Coming soon"**.
5. **Onboarding (`/onboarding`)** — a guided multi-screen first-run flow (see "Onboarding flow" below).

## The five soundtrack modes (single source of truth — do not hardcode names elsewhere)
A registry defines five modes, each with a label, subtitle, accent color/dot, a **polarity** (`lift` = energizing, or `settle` = calming), and a `hasLyrics` flag:

| Mode | Subtitle | Polarity | Lyrics | Dot |
|---|---|---|---|---|
| intense | Grounding & priming | lift | **yes** | amber `#E8A92E` |
| focused | Deep-work flow | settle | no | `#D5CB46` |
| social | Bright & open | lift | no | `#8AC55F` |
| light | Spacious & easy | settle | no | `#36B68A` |
| creative | Textured & curious | lift | no | `#2AA0A0` |

The event page shows these as a **5-button grid** (colored dot + label + subtitle). Only `intense` has sung lyrics today; the others are instrumental. These five must match the five moods listed on the landing page.

## Acoustic engine (the differentiator)
Each mode + a 0–100 load score produces a concrete **acoustic recipe**: `tempoBpm, energy, valence, repetition, surprise, uncertainty, timbre`. Grounded in the expectancy model of musical pleasure (Cheung et al., 2019): pleasure peaks at low-uncertainty+high-surprise ("anthemic lift") or high-uncertainty+low-surprise ("settling resolution"). Higher load grounds the track (fewer jolts). Reference recipes at load ≈ 62:

- **intense** ~102 BPM, energy 73%, surprise 30%, repetition 75%, uncertainty 28%, valence 72% — warm grounded low-end, steady driving pulse, confident keys.
- **focused** ~83 BPM, energy 35%, surprise 14%, repetition 87%, uncertainty 46%, valence 55% — low-distraction keys, soft pads, minimal percussion, no vocals.
- **social** ~119 BPM, energy 77%, surprise 51%, repetition 55%, uncertainty 28%, valence 86% — bright open chords, upbeat light percussion.
- **light** ~65 BPM, energy 22%, surprise 19%, repetition 78%, uncertainty 57%, valence 62% — spacious airy pads, unhurried felt piano, soft reverb.
- **creative** ~93 BPM, energy 60%, surprise 62%, repetition 45%, uncertainty 60%, valence 66% — textured evolving synths, curious motifs.

Display the recipe as a 6-metric card ("Acoustic recipe · from your day + this meeting") after generation, plus the Cheung profile label.

### Per-event calibration (the load is blended, not just the day)
The recipe must reflect **the specific meeting**, not just the day, so two events on the same day sound different. Compute a per-event intensity and blend it with the day score:
- `computeEventLoad(event)` → 0–100 from: **duration** (up to ~28 at 2h+), **+30 if high-stakes**, **external attendees** (≤24), **high-stakes keywords** (≤18), and an **early/evening slot** (<9am or ≥6pm, +8).
- `blendedLoad = round(0.55 × dayLoad + 0.45 × eventLoad)`, and the acoustic engine consumes `blendedLoad`.
- Example on a day at load 62: a 2pm board pitch → blended ≈ **63** (more grounding/steadier); a 9:30am 1:1 → blended ≈ **37** (lighter, airier). The mood check-in then calibrates on top of this.

## Before/after mood check-in (calibration)
On the event page, above Generate, show **"How do you feel about this right now?"** with three word-chip rows, each 1–3:
- **Ready:** Not yet · Getting there · Ready
- **Calm:** On edge · Okay · Calm
- **Confident:** Unsure · Steady · Confident

Skippable; never blocks generation. The answers calibrate the recipe **by mode polarity, not mode name**: for `lift` modes, the less confident/ready the user, the bolder the priming (higher tempo/energy/valence, steadier groove, fewer surprises); for `settle` modes, the less calm, the more soothing (slower, softer). Show a human-readable calibration note (e.g. "tuned for feeling unsure — steadier, grounding & more energising"). After the track finishes playing, ask again ("And now?"), show the **shift** (e.g. "Unsure → Steady"), and offer a one-tap "Re-tune to how you feel now". Persist both readings on the event so the system can learn which recipes move the user's state — this feedback loop is the moat.

## Add an event manually
On `/week`, a collapsed **"+ Add an event"** button expands into a form: **title** (required), **date** + **time** (required), **duration** (chip selector: 15/30/45/60/90 min), and optional **company**, **attendee email**, and **purpose**. On submit it runs the *same* scoring engine as the calendar sync — auto-computes the day's stress load, auto-detects high-stakes, and auto-picks the starting mode — then the new event appears in the week (and the stress curve updates). Helper text tells the user scoring is automatic and the mode is editable on the event. Manually-added events are tagged as a separate source so a later calendar re-sync never deletes them.

## Stress scoring & high-stakes detection (automatic, user-overridable)
This is the brain of the app — events are labelled automatically, but the user always has the final say:
- **Day stress score (0–100):** computed per day from number of meetings, total hours, back-to-back gaps (<15 min), early starts (<9am), little free time, and pressure keywords in titles/purpose ("deadline", "pitch", "review"…). Drives the week's stress curve and feeds the acoustic engine.
- **High-stakes flag (automatic):** an event is flagged if it has an **external attendee** (email domain differs from the user's), a **high-stakes keyword** (pitch/interview/board/client/ceo/investor/review/presentation), or is **>60 min**.
- **Starting mode (auto-defaulted):** high-stakes → **intense**; otherwise → **focused**. The user can override via the 5-mode selector at any time. Editing the event's **purpose** text re-runs high-stakes detection (it scans those words too).
- So the app *proposes* (from keywords/attendees/duration) and the user *disposes* (mode override + purpose text + mood check-in).

## Meeting context + lyrics
The event page has a "Meeting context" section: Who is it with? / What do they do? / What's the purpose?, plus an "Auto-fill from company" button (enriches from the attendee's company) and an optional voice-fill. For lyric modes (`intense`), generate **affirmation lyrics** built from the purpose + the company name (e.g. naming "NorthStar Robotics" and the goal) — second-person encouragement that must NOT narrate the user's own name. Show lyrics in a collapsible "Affirmation lyrics" only when the mode has lyrics.

**"Tell me more" context nudge:** because lyric tracks read generic without context, show a gentle, **non-blocking** hint above Generate **only when** `modeHasLyrics(mode) && !purpose && !who && !company`. Copy: *"Tell me a bit more so the affirmation fits this meeting — add the purpose (and who it's with) and they'll name what you're walking into."* Include an "Add details" link that scrolls to and focuses the purpose field. Never show it for instrumental modes; never block generation (the user can generate anyway, it'll just be more generic).

## Music generation (provider cascade)
Build a style prompt from the acoustics (tempo/energy/valence/repetition/surprise/ambiguity + timbre + mode descriptor + "with vocals"/"instrumental" + optional taste hint), then render audio via a cascade, first available wins: **Suno → ElevenLabs Music → Replicate MusicGen → Spotify (track select) → bundled sample WAV.** With a real generation key, label the player "Generated with ElevenLabs Music · style: …"; without one, fall back to a Spotify embed labelled "Matched from Spotify". The acoustic recipe + lyrics are always computed regardless of provider. Show a small player with play/scrub and the mode title.

## Integrations & data
- **Google Calendar OAuth** (read-only times + titles) to import a real week into `/week` with stress scoring; works in "testing" mode for added test users. Everything else (demo week, generation, waitlist) works with no login.
- **Spotify**: a typed "music taste" field steers generation today; linking a personal playlist is "Coming soon" (pending Spotify quota/extended access).
- Optional: push/SMS reminders ("prep cadence": night before / morning of / 15 min before), voice input for context, Stripe for Pro.
- Store events with: title, time, duration, attendees, company, stressScore, isHighStakes, mode (default `focused`), cadence, moodBefore/moodAfter, generated track + lyrics, and a `source` field (`seed` | `google` | `manual`).
- Reminders are scheduled per event from the cadence (once / standard / full) at: night before (9pm), morning of (8am), 15 min before.

## Onboarding flow (`/onboarding`)
A guided, iOS-style first-run flow rendered inside a single **phone frame** (one screen visible at a time, driven by a `screen` state value; phone container radius 46px). It has its **own visual system, distinct from the app's aurora theme**: soft off-white background `#F9FAF7`, ink text `#14201A`/`#1A1A1A`, teal accent `#0E9E8E`, brand green `#86DF8D`, lime `#D6F56E`, dark pill CTA `#263238`, field fill `#F6F8F4`. SF Pro / Inter for most screens; **Instrument Serif (headline) + Nunito (wordmark/CTA) + Nunito Sans (body) only on the green welcome splash**. Primary buttons: full-width, 56px tall, 28px radius, dark `#263238`. Cards/inputs: 18–22px radius, hairline borders `rgba(20,32,26,0.1)`. Screen-enter animation: fade + 10px rise (~600ms); press feedback `scale(0.98)`.

**Flow (7 screens):** `Welcome splash → Carousel (2 panels) → Connect calendar → Phone number → Music taste → Calendar scoring (auto) → This week in sound → [app home]`.

1. **Welcome splash** — full-bleed animated green gradient (`linear-gradient(176deg, #0a3b2c, #115239, #1d7a4e, #3da75f, #7ccf6d, #BBE96B, #D6F56E)` at 200% size, panning ~22s) layered with two blurred lime wave gradients (slow skew/translate drift), a fractal-noise overlay, and a bottom dark shade. Sounday wordmark (4-bar mark, lime "d", Nunito). Instrument-Serif headline (~54px, italic accents) **"Start *calm.* Stay *focused.* Finish *strong.*"** + Nunito-Sans sub "Your calendar turned into the soundtrack that gets you ready for what's next." Three frosted feature pills (lime glow dots): **"Calmer mornings"**, **"A 10-minute wind-down before big meetings"**, **"The right track, exactly on time"**. Lime→green gradient CTA **"Learn more →"** (Nunito).
2. **Carousel (2 panels)** — off-white; top nav has back chevron + **"Skip"** on **both** panels (skip jumps straight to Connect). Each panel: a circular illustration (final assets `public/onboarding/carousel-1.png` = person in headphones, `carousel-2.png` = speaker + checklist) over a mint blob, a centered bold title (~27px) and gray body, page dots (active = green pill `#92E3A9`), CTA **"Continue"** (panel 0) then **"Get Started"** (panel 1). Copy: p0 "The right music to perform. Backed by science." / "Connect your calendar and Sounday builds your personal soundtrack before the week begins."; p1 "Music that knows your schedule" / "Back-to-back meetings get calm, grounding tracks. High-stakes moments get a confidence-priming Prime track."
3. **Connect calendar** — title "First, let's see your week." + privacy line "Sounday reads event titles, times, and duration only. Processed in memory and immediately discarded. Your meetings stay yours." Two connect cards (white icon tile + real **Google Calendar** / **Microsoft Outlook** logo, label, **"Connect"** action, chevron) and an underlined **"Upload an ICS file instead"** link. The **Google card starts the real Google OAuth connect** (read-only) when configured (otherwise it shows "Demo" and advances); Outlook + ICS advance to the next step.
4. **Phone number** — "Where should we ping you?", one underline `tel` field ("for SMS prep tracks"), caption "Optional — you can add this later.", dark CTA **Continue**.
5. **Music taste** — "Your music taste", up to **5** genre/artist chips (fill-style input + bordered teal **"Add"** button, or a placeholder **"Add by voice"** with mic icon), `n/5` counter, empty-state note when none, removable teal chips, hint line, dark CTA **"See my week"**. Persists phone + taste before advancing.
6. **Calendar scoring (transitional)** — centered ripple rings around a teal checkmark, "Your week is in." / "Sounday is scoring your week now.", animated equalizer bars. **Auto-advances after 3.6s** (this timer stands in for the real connect + async scoring job — keep the animation as the loading state). No button.
7. **This week in sound** — off-white scrollable summary: eyebrow "YOUR WEEK" + "This week in sound"; a white **stress-curve card** (teal line + green area fill Mon–Sun with the Wed peak enlarged), then day blocks (e.g. Monday "Light · load 25" with event rows carrying green "Wind-down" dot-chips; Tuesday "Busy · load 62 · suggests wind-down"). Pinned dark CTA **"Enter Sounday"** → the main app (`/week`).

**Routing:** Skip (carousel) → Connect. Back chevron appears on the carousel + Connect/Phone/Music/This-week, with **explicit** back targets (not "screen − 1"): Connect → carousel p1, Phone → Connect, Music → Phone, This-week → Music. **Persist** phone + music taste (and an `onboarded` flag) when leaving Music; "Enter Sounday" routes into the app home.

**Integration TODOs / mock data:** the scoring screen's 3.6s timer is a stand-in for the real fetch + scoring; and the "This week in sound" chart/loads/events are static mock data — wire to the real calendar/scoring data on integration. Outlook + ICS are not yet wired (advance to the next step for now). The carousel illustrations are final assets shipped under `public/onboarding/`.

## Tech (reference — adapt to Base44)
Next.js (App Router) + TypeScript + Tailwind, Prisma + SQLite, deployed on Render. Keep a `modes` registry as the single source for all mode logic (UI, calibration, lyrics eligibility, prompt building) so adding/removing a mode is one edit.
