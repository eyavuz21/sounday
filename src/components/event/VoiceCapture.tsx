"use client";

import { useCallback, useRef, useState } from "react";

type Fields = "who" | "what" | "purpose";

const QUESTIONS: { field: Fields; q: string }[] = [
  { field: "who", q: "Who is the meeting with?" },
  { field: "what", q: "What does their company do?" },
  { field: "purpose", q: "What's the purpose of the meeting?" },
];

// Minimal Web Speech API typings (not in default DOM lib).
interface SRResult {
  0: { transcript: string };
  isFinal: boolean;
}
interface SREvent {
  results: ArrayLike<SRResult>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
  start: () => void;
  stop: () => void;
}

export default function VoiceCapture({
  vapiPublicKey,
  onField,
}: {
  vapiPublicKey: string | null;
  onField: (field: Fields, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [active, setActive] = useState<Fields | null>(null);
  const vapiRef = useRef<unknown>(null);
  const srRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = useCallback(() => {
    setOpen(false);
    setActive(null);
    setStatus("");
    try {
      srRef.current?.stop();
    } catch {
      /* noop */
    }
    const vapi = vapiRef.current as { stop?: () => void } | null;
    try {
      vapi?.stop?.();
    } catch {
      /* noop */
    }
  }, []);

  // ---- Vapi live voice flow ----
  const startVapi = useCallback(async () => {
    if (!vapiPublicKey) return;
    setOpen(true);
    setStatus("Connecting…");
    const mod = await import("@vapi-ai/web");
    const Vapi = mod.default;
    const vapi = new Vapi(vapiPublicKey);
    vapiRef.current = vapi;

    let turn = -1; // advances on each assistant question

    vapi.on("call-start", () => setStatus("Listening — answer out loud."));
    vapi.on("call-end", () => stop());
    vapi.on("error", () => {
      setStatus("Voice error — try typing instead.");
    });

    vapi.on("speech-start", () => {
      // assistant started speaking a new question
      turn = Math.min(turn + 1, QUESTIONS.length - 1);
      const f = QUESTIONS[Math.max(turn, 0)].field;
      setActive(f);
    });

    vapi.on("message", (m: { type?: string; role?: string; transcript?: string; transcriptType?: string }) => {
      if (
        m.type === "transcript" &&
        m.role === "user" &&
        m.transcriptType === "final" &&
        m.transcript
      ) {
        const idx = Math.max(turn, 0);
        const field = QUESTIONS[Math.min(idx, QUESTIONS.length - 1)].field;
        onField(field, m.transcript.trim());
      }
    });

    await vapi.start({
      firstMessage:
        "Hi! Let's prep your meeting. First — who is the meeting with?",
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You help a user prep for a meeting. Ask exactly three short questions, ONE at a time, waiting for the answer before the next: 1) Who is the meeting with? 2) What does their company do? 3) What is the purpose of the meeting? After the third answer, thank them briefly and end the call. Keep each prompt to one sentence.",
          },
        ],
      },
      voice: { provider: "vapi", voiceId: "Elliot" },
      transcriber: { provider: "deepgram", model: "nova-2", language: "en" },
    } as Parameters<typeof vapi.start>[0]);
  }, [vapiPublicKey, onField, stop]);

  // ---- On-device fallback (Web Speech API) ----
  const startWebSpeech = useCallback(() => {
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setOpen(true);
      setStatus(
        "Voice input isn't supported in this browser. Please type your answers.",
      );
      return;
    }
    setOpen(true);
    let i = 0;

    const ask = () => {
      if (i >= QUESTIONS.length) {
        setStatus("All done!");
        setTimeout(stop, 800);
        return;
      }
      const { field, q } = QUESTIONS[i];
      setActive(field);
      setStatus(q);
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(q);
        window.speechSynthesis.speak(u);
      }
      const rec = new Ctor();
      srRef.current = rec;
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e: SREvent) => {
        const last = e.results[e.results.length - 1];
        const text = last[0].transcript.trim();
        if (text) onField(field, text);
      };
      rec.onerror = () => {
        setStatus("Didn't catch that — try the next field or type it.");
      };
      rec.onend = () => {
        i += 1;
        setTimeout(ask, 600);
      };
      rec.start();
    };
    ask();
  }, [onField, stop]);

  const start = vapiPublicKey ? startVapi : startWebSpeech;

  return (
    <div>
      <button
        type="button"
        onClick={open ? stop : start}
        className={`btn ${
          open
            ? "bg-rose-500 text-white"
            : "bg-white/70 text-sea-700 ring-1 ring-sea-200"
        } w-full`}
      >
        {open ? (
          <>
            <span className="h-2.5 w-2.5 animate-pulse-soft rounded-full bg-white" />
            Stop voice input
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" />
            </svg>
            Fill with voice {vapiPublicKey ? "" : "(beta)"}
          </>
        )}
      </button>
      {open && (
        <div className="mt-2 rounded-2xl bg-sea-50 p-3 text-sm text-sea-700">
          <p className="font-semibold">
            {active ? `Now: ${active}` : "Voice assistant"}
          </p>
          <p className="text-mist">{status}</p>
        </div>
      )}
    </div>
  );
}
