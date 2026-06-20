"use client";

import { useRef, useState } from "react";

interface SRResult {
  0: { transcript: string };
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

/** Single-utterance voice dictation (reuses the on-device speech flow). */
export default function DictateButton({
  onText,
  label = "Speak",
}: {
  onText: (text: string) => void;
  label?: string;
}) {
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const ref = useRef<SpeechRecognitionLike | null>(null);

  function start() {
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setUnsupported(true);
      return;
    }
    const rec = new Ctor();
    ref.current = rec;
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: SREvent) => {
      const last = e.results[e.results.length - 1];
      const text = last[0].transcript.trim();
      if (text) onText(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  }

  function stop() {
    ref.current?.stop();
    setListening(false);
  }

  if (unsupported) {
    return <span className="text-xs text-mist">Voice not supported here</span>;
  }

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      className={`btn min-h-[44px] px-4 text-sm ${
        listening
          ? "bg-rose-500 text-white"
          : "bg-white/70 text-sea-700 ring-1 ring-sea-200"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" />
      </svg>
      {listening ? "Listening…" : label}
    </button>
  );
}
