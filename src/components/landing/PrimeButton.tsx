"use client";

import { useState } from "react";

export default function PrimeButton() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function unlock() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setErr((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="text-center">
      <button onClick={unlock} disabled={loading} className="btn-ghost w-full">
        {loading ? "Opening checkout…" : "Unlock Prime mode — €1"}
      </button>
      <p className="mt-2 text-xs text-mist">
        Confidence-priming hype tracks for your biggest meetings.
      </p>
      {err && <p className="mt-2 text-sm text-rose-500">{err}</p>}
    </div>
  );
}
