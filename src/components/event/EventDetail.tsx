"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import VoiceCapture from "@/components/event/VoiceCapture";
import { reminderTimes } from "@/lib/stress";
import { fmtTime, fmtDayLong, CADENCE_OPTIONS } from "@/lib/format";
import type { SerializedEvent } from "@/lib/data";
import type { Cadence, EventMode } from "@/lib/types";

type Integrations = {
  suno: boolean;
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

  const [generating, setGenerating] = useState(false);
  const [genNote, setGenNote] = useState<string | null>(null);
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

  async function generate() {
    setGenerating(true);
    setGenNote(null);
    try {
      await patch({ contextWho: who, contextWhat: what, contextPurpose: purpose });
      const res = await fetch(`/api/events/${event.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setTrackUrl(data.trackUrl);
      setLyrics(data.lyrics);
      const src =
        data.source === "suno"
          ? "Generated with Suno"
          : "Using a sample track (Suno unavailable)";
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
          <ModeBtn
            active={mode === "winddown"}
            onClick={() => changeMode("winddown")}
            title="Wind-down"
            sub="Calm, low energy"
          />
          <ModeBtn
            active={mode === "prime"}
            onClick={() => changeMode("prime")}
            title="Prime"
            sub="Confident, hype"
          />
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

      {/* Generate + player */}
      <section className="card mb-4">
        <button
          onClick={generate}
          disabled={generating}
          className="btn-primary mb-4 w-full"
        >
          {generating ? "Composing your track…" : "Generate soundtrack"}
        </button>
        <AudioPlayer
          src={trackUrl}
          title={mode === "prime" ? "Prime — hype track" : "Wind-down — calm track"}
          subtitle={event.title}
          accent={mode === "prime" ? "amber" : "sea"}
        />
        {genNote && <p className="mt-2 text-xs text-mist">{genNote}</p>}
        {lyrics && mode === "prime" && (
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
        Integrations:{" "}
        {Object.entries(integrations)
          .map(([k, v]) => `${k} ${v ? "live" : "sample"}`)
          .join(" · ")}
      </p>
    </main>
  );
}

function ModeBtn({
  active,
  onClick,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
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
      <span className="block font-semibold">{title}</span>
      <span className={`block text-xs ${active ? "text-sea-100" : "text-mist"}`}>
        {sub}
      </span>
    </button>
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
