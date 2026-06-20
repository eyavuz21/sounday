"use client";

import { useEffect, useRef, useState } from "react";

export default function AudioPlayer({
  src,
  title,
  subtitle,
  accent = "sea",
}: {
  src: string | null;
  title: string;
  subtitle?: string;
  accent?: "sea" | "amber";
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrent(0);
  }, [src]);

  function toggle() {
    const a = audioRef.current;
    if (!a || !src) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      void a.play();
      setPlaying(true);
    }
  }

  function onTime() {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    setCurrent(a.currentTime);
    setDuration(a.duration);
    setProgress((a.currentTime / a.duration) * 100);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * a.duration;
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const grad =
    accent === "amber"
      ? "from-amber-400 to-orange-400"
      : "from-sea-500 to-teal-500";
  const bar = accent === "amber" ? "bg-amber-400" : "bg-teal-500";

  // Spotify tracks play through Spotify's embed iframe (no Premium/OAuth needed).
  if (src && src.includes("open.spotify.com")) {
    const embed = src.replace("/track/", "/embed/track/");
    return (
      <div className="rounded-3xl bg-gradient-to-br from-sea-800 to-sea-900 p-3 text-white shadow-soft">
        <p className="px-2 pb-2 pt-1 text-sm font-semibold">{title}</p>
        <iframe
          title={title}
          src={embed}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-2xl"
        />
        {subtitle && (
          <p className="px-2 pb-1 pt-2 text-xs text-sea-200">{subtitle}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-gradient-to-br from-sea-800 to-sea-900 p-5 text-white shadow-soft">
      <audio
        ref={audioRef}
        src={src ?? undefined}
        onTimeUpdate={onTime}
        onLoadedMetadata={onTime}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          disabled={!src}
          aria-label={playing ? "Pause" : "Play"}
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-white shadow-glow transition active:scale-95 disabled:opacity-40`}
        >
          {playing ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{title}</p>
          {subtitle && (
            <p className="truncate text-sm text-sea-200">{subtitle}</p>
          )}
          {!src && (
            <p className="text-xs text-sea-300">No track yet — generate one.</p>
          )}
        </div>
      </div>

      <div
        onClick={seek}
        className="mt-4 h-2 cursor-pointer overflow-hidden rounded-full bg-white/20"
      >
        <div
          className={`h-full ${bar} transition-[width]`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-sea-200">
        <span>{fmt(current)}</span>
        <span>{duration ? fmt(duration) : "0:00"}</span>
      </div>
    </div>
  );
}
