"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TasteEditor from "@/components/TasteEditor";

export default function Onboarding({
  initialTaste,
  initialPhone,
}: {
  initialTaste: string[];
  initialPhone: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [taste, setTaste] = useState<string[]>(initialTaste);
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, musicTaste: taste, onboarded: true }),
    });
    router.push("/week");
  }

  const steps = [
    {
      title: "Welcome to Sounday",
      body: (
        <div className="space-y-4">
          <p className="text-mist">
            We turn your week into a soundtrack — calm tracks when you&apos;re
            overloaded, hype tracks before the big moments. Let&apos;s set you up
            in 30 seconds.
          </p>
        </div>
      ),
    },
    {
      title: "Where should we ping you?",
      body: (
        <div>
          <label className="label">Phone number (for SMS prep tracks)</label>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            placeholder="+44 7700 900123"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="mt-2 text-xs text-mist">Optional — you can add this later.</p>
        </div>
      ),
    },
    {
      title: "Your music taste",
      body: (
        <div>
          <p className="mb-3 text-sm text-mist">
            Add up to 5 favourite genres or artists — by typing or voice. We use
            them as a style hint while keeping each track&apos;s mood. Optional.
          </p>
          <TasteEditor value={taste} onChange={setTaste} />
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;

  return (
    <main className="app-shell flex min-h-screen flex-col">
      <div className="mb-6 flex gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= step ? "bg-sea-500" : "bg-sea-200"
            }`}
          />
        ))}
      </div>

      <div className="card animate-fade-up flex-1">
        <h1 className="mb-3 text-2xl font-bold text-ink">{steps[step].title}</h1>
        {steps[step].body}
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="btn-ghost flex-1"
          >
            Back
          </button>
        )}
        {!isLast ? (
          <button onClick={() => setStep((s) => s + 1)} className="btn-primary flex-1">
            Continue
          </button>
        ) : (
          <button onClick={finish} disabled={busy} className="btn-primary flex-1">
            {busy ? "Setting up…" : "See my week"}
          </button>
        )}
      </div>
    </main>
  );
}
