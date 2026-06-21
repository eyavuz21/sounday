"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DURATIONS = [15, 30, 45, 60, 90];

function defaultDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AddEventForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate());
  const [time, setTime] = useState("10:00");
  const [durationMinutes, setDuration] = useState(30);
  const [company, setCompany] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [contextPurpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setDate(defaultDate());
    setTime("10:00");
    setDuration(30);
    setCompany("");
    setAttendeeEmail("");
    setPurpose("");
    setError(null);
  }

  async function submit() {
    if (!title.trim()) {
      setError("Give the event a title");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date,
          time,
          durationMinutes,
          company,
          attendeeEmail,
          contextPurpose,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not add the event");
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not add the event");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card flex w-full items-center justify-center gap-2 p-4 text-sm font-semibold text-sea-700 transition hover:shadow-soft active:scale-[0.99]"
      >
        <span className="text-lg leading-none">+</span> Add an event
      </button>
    );
  }

  return (
    <section className="card animate-fade-up p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Add an event</h2>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-sm font-medium text-mist hover:text-ink"
        >
          Cancel
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mist">
            Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pitch to NorthStar CEO"
            className="w-full rounded-xl border border-sea-100 px-3 py-2 text-sm text-ink outline-none focus:border-sea-400"
          />
        </label>

        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mist">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-sea-100 px-3 py-2 text-sm text-ink outline-none focus:border-sea-400"
            />
          </label>
          <label className="block w-28">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mist">
              Time
            </span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-xl border border-sea-100 px-3 py-2 text-sm text-ink outline-none focus:border-sea-400"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mist">
            Duration
          </span>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`badge transition ${
                  durationMinutes === d
                    ? "bg-sea-700 text-white"
                    : "bg-sea-100 text-sea-700"
                }`}
              >
                {d < 60 ? `${d}m` : `${d / 60}h`}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mist">
            Company <span className="font-normal normal-case">(optional)</span>
          </span>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. NorthStar Robotics"
            className="w-full rounded-xl border border-sea-100 px-3 py-2 text-sm text-ink outline-none focus:border-sea-400"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mist">
            Attendee email{" "}
            <span className="font-normal normal-case">
              (optional — an external domain flags it high-stakes)
            </span>
          </span>
          <input
            value={attendeeEmail}
            onChange={(e) => setAttendeeEmail(e.target.value)}
            placeholder="e.g. ceo@northstar.com"
            className="w-full rounded-xl border border-sea-100 px-3 py-2 text-sm text-ink outline-none focus:border-sea-400"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-mist">
            Purpose <span className="font-normal normal-case">(optional)</span>
          </span>
          <input
            value={contextPurpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="What's it for?"
            className="w-full rounded-xl border border-sea-100 px-3 py-2 text-sm text-ink outline-none focus:border-sea-400"
          />
        </label>

        {error && <p className="text-sm font-medium text-rose-500">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="mt-1 rounded-xl bg-sea-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sea-800 active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add to my week"}
        </button>
        <p className="text-xs text-mist">
          Sounday scores it automatically — high-stakes detection picks the
          starting mode, which you can change on the event.
        </p>
      </div>
    </section>
  );
}
