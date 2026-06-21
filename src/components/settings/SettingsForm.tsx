"use client";

import { useEffect, useState } from "react";
import TasteEditor from "@/components/TasteEditor";
import type { NotifPrefs } from "@/lib/types";

type Integrations = { twilio: boolean; spotify: boolean; google: boolean };

export default function SettingsForm({
  initial,
  integrations,
}: {
  initial: {
    phone: string | null;
    musicTaste: string[];
    spotifyPlaylist: string | null;
    notifPrefs: NotifPrefs;
    googleEmail: string | null;
  };
  integrations: Integrations;
}) {
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [taste, setTaste] = useState<string[]>(initial.musicTaste);
  const [playlist, setPlaylist] = useState(initial.spotifyPlaylist ?? "");
  const [prefs, setPrefs] = useState<NotifPrefs>(initial.notifPrefs);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<string | null>(null);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("google");
    if (!status) return;
    if (status === "connected") setGoogleStatus("Google Calendar connected.");
    else if (status === "denied")
      setGoogleStatus("Connection cancelled — you didn't grant access.");
    else if (status === "error")
      setGoogleStatus("Couldn't connect to Google. Please try again.");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function syncGoogle() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/google/sync", { method: "POST" });
      const json = await res.json();
      setSyncMsg(
        res.ok ? `Synced ${json.synced} events` : json.error ?? "Sync failed",
      );
    } catch {
      setSyncMsg("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function disconnectGoogle() {
    await fetch("/api/google/disconnect", { method: "POST" });
    window.location.reload();
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          musicTaste: taste,
          spotifyPlaylist: playlist,
          notifPrefs: prefs,
        }),
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
        <p className="mt-2 text-xs text-mist">
          Up to 5 genres or artists. We keep the mode&rsquo;s mood (calm vs.
          confident) but shape the generated track toward these.
        </p>
      </section>

      <section className="card">
        <label className="label flex items-center gap-2" htmlFor="playlist">
          <span>
            Link a Spotify playlist <span className="text-mist">(optional)</span>
          </span>
          <span className="badge bg-amber-100 text-amber-700">Coming soon</span>
        </label>
        <input
          id="playlist"
          className="input"
          type="url"
          inputMode="url"
          placeholder="https://open.spotify.com/playlist/…"
          value={playlist}
          onChange={(e) => setPlaylist(e.target.value)}
        />
        <p className="mt-2 text-xs text-mist">
          We&rsquo;ll read the playlist&rsquo;s artists and steer new tracks
          toward that style (kept to each mode&rsquo;s mood). Playlist
          personalization is awaiting Spotify&rsquo;s extended-access approval —
          for now your music taste above shapes every track.
        </p>
      </section>

      <section className="card">
        <span className="label">Google Calendar</span>
        {initial.googleEmail ? (
          <div className="mt-1 flex flex-col gap-3">
            <p className="text-sm text-ink">
              Connected as{" "}
              <span className="font-semibold">{initial.googleEmail}</span>. Your
              upcoming events are pulled in automatically and scored.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={syncGoogle}
                disabled={syncing}
                className="btn-ghost"
              >
                {syncing ? "Syncing…" : "Sync now"}
              </button>
              <button
                onClick={disconnectGoogle}
                className="btn-ghost text-rose-600"
              >
                Disconnect
              </button>
            </div>
            {syncMsg && <p className="text-xs text-mist">{syncMsg}</p>}
          </div>
        ) : integrations.google ? (
          <div className="mt-1 flex flex-col gap-2">
            <p className="text-sm text-mist">
              Connect your Google account to auto-import your schedule — no CSV
              upload. We request read-only access to your calendar.
            </p>
            <a
              href="/api/google/connect"
              onClick={() => setConnecting(true)}
              aria-disabled={connecting}
              className={`btn-primary text-center ${
                connecting ? "pointer-events-none opacity-70" : ""
              }`}
            >
              {connecting ? "Connecting…" : "Connect Google Calendar"}
            </a>
            {googleStatus && (
              <p className="text-xs text-mist">{googleStatus}</p>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-mist">
            Google Calendar isn&rsquo;t configured yet (no OAuth credentials). Once
            set up, you&rsquo;ll be able to connect your account here to import
            your schedule automatically.
          </p>
        )}
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
