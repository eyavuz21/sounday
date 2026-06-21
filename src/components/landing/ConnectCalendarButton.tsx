"use client";

import { useState } from "react";

/**
 * Hero CTA. When Google Calendar is configured it kicks off the real OAuth
 * connect flow (with a "Connecting…" state); otherwise it falls back to the
 * demo week so the app is still usable with no account connected.
 */
export default function ConnectCalendarButton({
  googleConfigured,
}: {
  googleConfigured: boolean;
}) {
  const [connecting, setConnecting] = useState(false);

  function handleClick() {
    if (googleConfigured) {
      setConnecting(true);
      window.location.href = "/api/google/connect";
    } else {
      window.location.href = "/week";
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={connecting}
      style={{
        fontSize: "15px",
        fontWeight: 500,
        color: "#08251c",
        textDecoration: "none",
        background: "#EAF3EE",
        padding: "16px 30px",
        borderRadius: "9999px",
        border: "none",
        cursor: connecting ? "default" : "pointer",
        opacity: connecting ? 0.7 : 1,
      }}
    >
      {connecting ? "Connecting…" : "Connect your calendar"}
    </button>
  );
}
