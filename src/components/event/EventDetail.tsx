"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import type { Acoustics } from "@/lib/acoustics";
import VoiceCapture from "@/components/event/VoiceCapture";
import MoodCheck from "@/components/event/MoodCheck";
import { reminderTimes } from "@/lib/stress";
import { fmtTime, fmtDayLong, CADENCE_OPTIONS } from "@/lib/format";
import { feelingShift } from "@/lib/feeling";
import { MODE_LIST, modeConfig, modeHasLyrics, modeLabel } from "@/lib/modes";
import type { SerializedEvent } from "@/lib/data";
import type { Cadence, EventMode, Feeling } from "@/lib/types";

type Integrations = {
  music: string;
  cala: boolean;
  vapi: boolean;
  twilio: boolean;
  stripe: boolean;
};

export default function EventDetail({
  event,
  vapiPublicKey,
  integrations,
  hasPhone,
}: {
  event: SerializedEvent;
  vapiPublicKey: string | null;
  integrations: Integrations;
  hasPhone: boolean;
}) {
  const [who, setWho] = useState(event.contextWho ?? "");
  const [what, setWhat] = useState(event.contextWhat ?? "");
  const [purpose, setPurpose] = useState(event.contextPurpose ?? "");
  const [mode, setMode] = useState<EventMode>(event.mode);
  const [cadence, setCadence] = useState<Cadence>(event.cadence);
  const [trackUrl, setTrackUrl] = useState<string | null>(event.trackUrl);
  const [lyrics, setLyrics] = useState<string | null>(event.lyrics);
  const [highStakes, setHighStakes] = useState(event.isHighStakes);

  const [moodBefore, setMoodBefore] = useState<Feeling | null>(event.moodBefore);
  const [moodAfter, setMoodAfter] = useState<Feeling | null>(event.moodAfter);
  // Reveal the after check-in once a track has finished (or one was already saved).
  const [showAfter, setShowAfter] = useState<boolean>(Boolean(event.moodAfter));

  const [generating, setGenerating] = useState(false);
  const [genNote, setGenNote] = useState<string | null>(null);
  const [acoustics, setAcoustics] = useState<Acoustics | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [facts, setFacts] = useState<{ text: string; source?: string | null }[]>([]);
  const [calaNote, setCalaNote] = useState<string | null>(null);
  const [smsMsg, setSmsMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const start = useMemo(() => new Date(event.startISO), [event.startISO]);
  const schedule = useMemo(
    () => reminderTimes(start, cadence),
    [start, cadence],
  );

  async function patch(partial: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const data = await res.json();
      if (data?.event?.isHighStakes != null)
        setHighStakes(data.event.isHighStakes);
    } catch {
      /* best-effort autosave */
    }
  }

  function changeMode(next: EventMode) {
    setMode(next);
    void patch({ mode: next });
  }
  function changeCadence(next: Cadence) {
    setCadence(next);
    void patch({ cadence: next });
  }

  function saveMoodBefore(next: Feeling) {
    setMoodBefore(next);
    void patch({ moodBefore: next });
  }
  function saveMoodAfter(next: Feeling) {
    setMoodAfter(next);
    void patch({ moodAfter: next });
  }

  async function generate(feeling: Feeling | null = moodBefore) {
    setGenerating(true);
    setGenNote(null);
    try {
      await patch({ contextWho: who, contextWhat: what, contextPurpose: purpose });
      const res = await fetch(`/api/events/${event.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, feeling }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setTrackUrl(data.trackUrl);
      setLyrics(data.lyrics);
      setAcoustics(data.acoustics ?? null);
      const labels: Record<string, string> = {
        suno: "Generated with Suno",
        elevenlabs: "Generated with ElevenLabs Music",
        replicate: "Generated with MusicGen",
        spotify: "Matched from Spotify",
        sample: "Using a sample track",
      };
      const src = labels[data.provider] ?? "Track ready";
      const style = data.styleHint ? ` · style: ${data.styleHint}` : "";
      setGenNote(`${src}${style}`);
    } catch (e) {
      setGenNote((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function enrich() {
    setEnriching(true);
    setCalaNote(null);
    try {
      const res = await fetch(`/api/events/${event.id}/enrich`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enrichment failed");
      setFacts(data.facts ?? []);
      if (data.contextWhat && !what) setWhat(data.contextWhat);
      setCalaNote(
        data.source === "cala"
          ? `Sourced from Cala`
          : "Cala unavailable — connect a key to auto-fill company facts.",
      );
    } catch (e) {
      setCalaNote((e as Error).message);
    } finally {
      setEnriching(false);
    }
  }

  async function sendTestSms() {
    setSending(true);
    setSmsMsg(null);
    try {
      const res = await fetch(`/api/events/${event.id}/sms-test`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send");
      setSmsMsg(
        data.simulated
          ? `Simulated SMS to ${data.to}: "${data.body}"`
          : `Sent to ${data.to} ✓`,
      );
    } catch (e) {
      setSmsMsg((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="app-shell">
      <Link
        href="/week"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-sea-600"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to week
      </Link>

      <header className="mb-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {highStakes && (
            <span className="badge bg-rose-100 text-rose-600">High-stakes</span>
          )}
          {event.company && (
            <span className="badge bg-teal-400/10 text-teal-600">
              {event.company}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-ink">{event.title}</h1>
        <p className="mt-1 text-mist">
          {fmtDayLong(event.startISO)} · {fmtTime(event.startISO)} ·{" "}
          {event.durationMinutes} min
        </p>
        {event.attendees.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {event.attendees.map((a) => (
              <span
                key={a.email}
                className="badge bg-sea-100 text-sea-700"
                title={a.email}
              >
                {a.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Mode toggle */}
      <section className="card mb-4">
        <span className="label">Soundtrack mode</span>
        <div className="grid grid-cols-2 gap-2">
          {MODE_LIST.map((m) => (
            <ModeBtn
              key={m.mode}
              active={mode === m.mode}
              onClick={() => changeMode(m.mode)}
              title={m.label}
              sub={m.sub}
              dotColor={m.dotColor}
            />
          ))}
        </div>
      </section>

      {/* Meeting context */}
      <section className="card mb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="label mb-0">Meeting context</span>
          {event.company && (
            <button
              onClick={enrich}
              disabled={enriching}
              className="text-xs font-semibold text-teal-600 disabled:opacity-50"
            >
              {enriching ? "Fetching…" : "Auto-fill from company"}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Field
            label="Who is it with?"
            value={who}
            onChange={setWho}
            onBlur={() => patch({ contextWho: who })}
            placeholder="e.g. Alex Mercer, CEO & co-founder"
          />
          <Field
            label="What do they do?"
            value={what}
            onChange={setWhat}
            onBlur={() => patch({ contextWhat: what })}
            placeholder="e.g. Builds warehouse robotics for retailers"
            textarea
          />
          <Field
            label="What's the purpose?"
            value={purpose}
            onChange={setPurpose}
            onBlur={() => patch({ contextPurpose: purpose })}
            placeholder="e.g. Win a paid pilot"
            textarea
          />
        </div>

        <div className="mt-3">
          <VoiceCapture
            vapiPublicKey={vapiPublicKey}
            onField={(field, value) => {
              if (field === "who") {
                setWho(value);
                void patch({ contextWho: value });
              } else if (field === "what") {
                setWhat(value);
                void patch({ contextWhat: value });
              } else {
                setPurpose(value);
                void patch({ contextPurpose: value });
              }
            }}
          />
        </div>

        {facts.length > 0 && (
          <div className="mt-3 rounded-2xl bg-teal-400/10 p-3">
            <p className="mb-1 text-xs font-semibold text-teal-700">
              Company facts (Cala)
            </p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-sea-700">
              {facts.map((f, i) => (
                <li key={i}>
                  {f.text}
                  {f.source && (
                    <a
                      href={f.source}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 text-xs text-teal-600 underline"
                    >
                      source
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {calaNote && <p className="mt-2 text-xs text-mist">{calaNote}</p>}
      </section>

      {/* Before check-in — feeds the generation */}
      <section className="card mb-4">
        <span className="label">How do you feel about this right now?</span>
        <p className="mb-3 -mt-1 text-sm text-mist">
          Your track is tuned to match — skip if you&apos;d rather not.
        </p>
        <MoodCheck
          value={moodBefore}
          onChange={saveMoodBefore}
          accent={modeConfig(mode).accent}
        />
      </section>

      {/* Generate + player */}
      <section className="card mb-4">
        <button
          onClick={() => generate()}
          disabled={generating}
          className="btn-primary mb-4 w-full"
        >
          {generating ? "Composing your track…" : "Generate soundtrack"}
        </button>
        <AudioPlayer
          src={trackUrl}
          title={`${modeLabel(mode)} — ${modeConfig(mode).sub.toLowerCase()}`}
          subtitle={event.title}
          accent={modeConfig(mode).accent}
          onEnded={() => setShowAfter(true)}
        />
        {genNote && <p className="mt-2 text-xs text-mist">{genNote}</p>}
        {acoustics && (
          <div className="mt-3 rounded-2xl bg-sea-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sea-500">
              Acoustic recipe · from your day&apos;s load
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Tempo" value={`${acoustics.tempoBpm}`} unit="bpm" />
              <Metric label="Energy" value={`${Math.round(acoustics.energy * 100)}`} unit="%" />
              <Metric label="Surprise" value={`${Math.round(acoustics.surprise * 100)}`} unit="%" />
              <Metric label="Repetition" value={`${Math.round(acoustics.repetition * 100)}`} unit="%" />
              <Metric label="Uncertainty" value={`${Math.round(acoustics.uncertainty * 100)}`} unit="%" />
              <Metric label="Valence" value={`${Math.round(acoustics.valence * 100)}`} unit="%" />
            </div>
            <p className="mt-2 text-center text-xs text-mist">{acoustics.profile}</p>
            {acoustics.calibration && (
              <p className="mt-1.5 text-center text-xs font-medium text-teal-600">
                ♪ {acoustics.calibration}
              </p>
            )}
          </div>
        )}
        {lyrics && modeHasLyrics(mode) && (
          <details className="mt-3 rounded-2xl bg-sea-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-sea-700">
              Affirmation lyrics
            </summary>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-sea-700">
              {lyrics}
            </pre>
          </details>
        )}
      </section>

      {/* After check-in — measures the shift, can re-tune */}
      {trackUrl && (
        <section className="card mb-4">
          {!showAfter ? (
            <button
              onClick={() => setShowAfter(true)}
              className="btn-ghost w-full"
            >
              I&apos;ve listened — how do you feel now?
            </button>
          ) : (
            <>
              <span className="label">And now — how do you feel?</span>
              <p className="mb-3 -mt-1 text-sm text-mist">
                After listening to your track.
              </p>
              <MoodCheck
                value={moodAfter}
                onChange={saveMoodAfter}
                accent={modeConfig(mode).accent}
              />
              {moodBefore && moodAfter && (
                <MoodShift before={moodBefore} after={moodAfter} />
              )}
              {moodAfter && (
                <button
                  onClick={() => generate(moodAfter)}
                  disabled={generating}
                  className="btn-ghost mt-3 w-full"
                >
                  {generating
                    ? "Re-tuning…"
                    : "Re-tune the track to how you feel now"}
                </button>
              )}
            </>
          )}
        </section>
      )}

      {/* Prep cadence */}
      <section className="card mb-4">
        <span className="label">Prep cadence</span>
        <div className="flex flex-col gap-2">
          {CADENCE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => changeCadence(o.value)}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition ${
                cadence === o.value
                  ? "bg-sea-500 text-white shadow-soft"
                  : "bg-white/70 text-ink ring-1 ring-sea-200"
              }`}
            >
              <span>
                <span className="block font-semibold">{o.label}</span>
                <span
                  className={`block text-sm ${
                    cadence === o.value ? "text-sea-100" : "text-mist"
                  }`}
                >
                  {o.hint}
                </span>
              </span>
              {cadence === o.value && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {schedule.length > 0 && (
          <div className="mt-3 rounded-2xl bg-sea-50 p-3 text-sm">
            <p className="mb-1 font-semibold text-sea-700">Reminders</p>
            <ul className="space-y-0.5 text-sea-600">
              {schedule.map((s, i) => (
                <li key={i} className="flex justify-between">
                  <span>{s.label}</span>
                  <span className="text-mist">
                    {s.sendAt.toLocaleString([], {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={sendTestSms}
          disabled={sending}
          className="btn-ghost mt-3 w-full"
        >
          {sending ? "Sending…" : "Send test SMS now"}
        </button>
        {!hasPhone && (
          <p className="mt-2 text-xs text-amber-600">
            Add a phone number in Settings to receive reminders.
          </p>
        )}
        {smsMsg && <p className="mt-2 text-xs text-sea-700">{smsMsg}</p>}
      </section>

      <p className="mb-2 text-center text-xs text-mist">
        Music: {integrations.music} · Cala{" "}
        {integrations.cala ? "live" : "demo"} · Vapi{" "}
        {integrations.vapi ? "live" : "demo"} · SMS{" "}
        {integrations.twilio ? "live" : "demo"} · Pay{" "}
        {integrations.stripe ? "live" : "demo"}
      </p>
    </main>
  );
}

function MoodShift({ before, after }: { before: Feeling; after: Feeling }) {
  const shift = feelingShift(before, after);
  const up = shift.delta > 0;
  const flat = shift.delta === 0;
  const tone = up
    ? "bg-teal-400/10 text-teal-700"
    : flat
      ? "bg-sea-50 text-sea-700"
      : "bg-amber-400/10 text-amber-700";
  const sign = up ? `+${shift.delta}` : `${shift.delta}`;
  return (
    <div className={`mt-3 rounded-2xl p-3 text-center text-sm ${tone}`}>
      <span className="font-semibold capitalize">{shift.from}</span>
      <span className="mx-2">→</span>
      <span className="font-semibold capitalize">{shift.to}</span>
      {!flat && <span className="ml-2 text-xs">({sign})</span>}
      <p className="mt-1 text-xs opacity-80">
        {up
          ? "Nice — the track moved you in the right direction."
          : flat
            ? "No change yet — try re-tuning below."
            : "Still tense — re-tune for a stronger lift."}
      </p>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  title,
  sub,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
  dotColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-left transition ${
        active
          ? "bg-gradient-to-br from-sea-500 to-teal-500 text-white shadow-soft"
          : "bg-white/70 text-ink ring-1 ring-sea-200"
      }`}
    >
      <span className="flex items-center gap-1.5 font-semibold">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: active ? "currentColor" : dotColor }}
        />
        {title}
      </span>
      <span className={`mt-0.5 block text-xs ${active ? "text-sea-100" : "text-mist"}`}>
        {sub}
      </span>
    </button>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-white/70 py-2">
      <p className="text-base font-bold text-ink">
        {value}
        <span className="text-xs font-medium text-mist">{unit}</span>
      </p>
      <p className="text-[10px] uppercase tracking-wide text-mist">{label}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea
          className="input min-h-[64px] resize-none"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      ) : (
        <input
          className="input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      )}
    </div>
  );
}
