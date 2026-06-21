"use client";

import { useState } from "react";

export default function EarlyAccessForm() {
  const [email, setEmail] = useState("");
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
      setStatus("done");
      setMsg("You're on the list — your first preview lands this Sunday.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMsg((err as Error).message);
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        marginTop: "36px",
        maxWidth: "440px",
        marginLeft: "auto",
        marginRight: "auto",
        flexWrap: "wrap",
      }}
    >
      <input
        type="email"
        required
        inputMode="email"
        autoComplete="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          flex: 1,
          minWidth: "200px",
          fontFamily: "inherit",
          fontSize: "15px",
          fontWeight: 300,
          color: "#F4F9F5",
          background: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: "9999px",
          padding: "15px 24px",
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          flex: "none",
          fontFamily: "inherit",
          fontSize: "15px",
          fontWeight: 500,
          color: "#08251c",
          background: "#EAF3EE",
          border: "none",
          borderRadius: "9999px",
          padding: "15px 28px",
          cursor: status === "loading" ? "default" : "pointer",
        }}
      >
        {status === "loading" ? "Joining…" : "Get access"}
      </button>
      {msg && (
        <p
          style={{
            width: "100%",
            margin: "4px 0 0",
            fontSize: "13px",
            fontWeight: 400,
            color: status === "error" ? "#f0a3a3" : "#8AC55F",
          }}
        >
          {msg}
        </p>
      )}
    </form>
  );
}
