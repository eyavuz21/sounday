"use client";

import { useState } from "react";
import TasteEditor from "@/components/TasteEditor";
import type { NotifPrefs } from "@/lib/types";

type Integrations = Record<string, boolean>;

export default function SettingsForm({
  initial,
  integrations,
}: {
  initial: {
    phone: string | null;
    musicTaste: string[];
    notifPrefs: NotifPrefs;
  };
  integrations: Integrations;
}) {
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [taste, setTaste] = useState<string[]>(initial.musicTaste);
  const [prefs, setPrefs] = useState<NotifPrefs>(initial.notifPrefs);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, musicTaste: taste, notifPrefs: prefs }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const toggle = (k: keyof NotifPrefs) =>
    setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="flex flex-col gap-4">
      <section className="card">
        <label className="label" htmlFor="phone">
          Phone number for SMS reminders
        </label>
        <input
          id="phone"
          className="input"
          type="tel"
          inputMode="tel"
          placeholder="+44 7700 900123"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="mt-2 text-xs text-mist">
          Include your country code. Twilio is{" "}
          {integrations.twilio ? "connected" : "in demo mode (SMS simulated)"}.
        </p>
      </section>

      <section className="card">
        <span className="label">Notification preferences</span>
        <div className="flex flex-col gap-1">
          <Toggle
            label="SMS reminders"
            sub="Master switch for all texts"
            on={prefs.sms}
            onClick={() => toggle("sms")}
          />
          <Toggle
            label="Night before"
            sub="9pm the evening before"
            on={prefs.nightBefore}
            onClick={() => toggle("nightBefore")}
          />
          <Toggle
            label="Morning of"
            sub="8am on the day"
            on={prefs.morningOf}
            onClick={() => toggle("morningOf")}
          />
          <Toggle
            label="15 minutes before"
            sub="Right before it starts"
            on={prefs.beforeMeeting}
            onClick={() => toggle("beforeMeeting")}
          />
        </div>
      </section>

      <section className="card">
        <span className="label">Your music taste</span>
        <TasteEditor value={taste} onChange={setTaste} />
      </section>

      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
      </button>
    </div>
  );
}

function Toggle({
  label,
  sub,
  on,
  onClick,
}: {
  label: string;
  sub: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between py-2.5 text-left"
    >
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        <span className="block text-sm text-mist">{sub}</span>
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          on ? "bg-teal-500" : "bg-sea-200"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}
