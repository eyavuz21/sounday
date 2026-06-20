"use client";

import { useState } from "react";

export default function WaitlistForm({ initialCount }: { initialCount: number }) {
  const [email, setEmail] = useState("");
  const [count, setCount] = useState(initialCount);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setCount(data.count);
      setStatus("done");
      setMsg("You're on the list. We'll be in touch.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMsg((err as Error).message);
    }
  }

  return (
    <div className="card animate-fade-up">
      <div className="mb-3 flex items-center justify-between">
        <span className="label mb-0">Join the waitlist</span>
        <span className="badge bg-sea-100 text-sea-700">
          {count.toLocaleString()} signed up
        </span>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary"
        >
          {status === "loading" ? "Joining…" : "Get early access"}
        </button>
      </form>
      {msg && (
        <p
          className={`mt-3 text-sm ${
            status === "error" ? "text-rose-500" : "text-teal-600"
          }`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
