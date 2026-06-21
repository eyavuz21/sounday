"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/* ── design tokens (from the onboarding spec) ───────────────────────── */
const BG = "#F9FAF7";
const INK = "#14201A";
const INK2 = "#1A1A1A";
const TEAL = "#0E9E8E";
const GREEN = "#86DF8D";
const LIME = "#D6F56E";
const DARK = "#263238";
const DOT_OFF = "#D7DAD9";
const FIELD = "#F6F8F4";
const MUTED = "rgba(20,32,26,0.46)";
const LINE = "rgba(20,32,26,0.1)";

const serif = "var(--font-instrument-serif), Georgia, serif";
const nunito = "var(--font-nunito), var(--font-inter), system-ui, sans-serif";
const sf =
  "var(--font-inter), -apple-system, 'SF Pro Text', system-ui, sans-serif";

type Screen = 20 | 21 | 6 | 1 | 13 | 5 | 14;
const MAX_GENRES = 5;

export default function Onboarding({
  initialTaste,
  initialPhone,
  googleConfigured,
}: {
  initialTaste: string[];
  initialPhone: string | null;
  googleConfigured: boolean;
}) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(20);
  const [page, setPage] = useState<0 | 1>(0);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [genres, setGenres] = useState<string[]>(initialTaste);
  const [genreInput, setGenreInput] = useState("");
  const [busy, setBusy] = useState(false);

  const persist = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          musicTaste: genres,
          onboarded: true,
        }),
      });
    } finally {
      setBusy(false);
    }
  }, [phone, genres]);

  /* screen 5 auto-advances to the week summary after 3.6s */
  useEffect(() => {
    if (screen !== 5) return;
    const t = setTimeout(() => setScreen(14), 3600);
    return () => clearTimeout(t);
  }, [screen]);

  function addGenres(raw: string) {
    const items = raw
      .split(/,| and |&|;/i)
      .map((s) => s.trim())
      .filter(Boolean);
    setGenres((prev) => {
      const next = [...prev];
      for (const it of items) {
        if (
          next.length < MAX_GENRES &&
          !next.some((x) => x.toLowerCase() === it.toLowerCase())
        ) {
          next.push(it);
        }
      }
      return next;
    });
    setGenreInput("");
  }

  function connectCalendar() {
    if (googleConfigured) {
      window.location.href = "/api/google/connect";
    } else {
      setScreen(1);
    }
  }

  function back() {
    if (screen === 21) {
      if (page === 1) setPage(0);
      else setScreen(20);
      return;
    }
    const map: Partial<Record<Screen, () => void>> = {
      6: () => {
        setPage(1);
        setScreen(21);
      },
      1: () => setScreen(6),
      13: () => setScreen(1),
      14: () => setScreen(13),
    };
    map[screen]?.();
  }

  const showChrome = screen === 6 || screen === 1 || screen === 13 || screen === 14;
  const showBack =
    screen === 21 || screen === 6 || screen === 1 || screen === 13 || screen === 14;

  return (
    <div style={styles.stage}>
      <style>{CSS}</style>
      <div
        style={{
          ...styles.phone,
          background: screen === 20 ? "#0a3b2c" : BG,
          fontFamily: screen === 20 ? nunito : sf,
        }}
      >
        {showChrome && <StatusBar />}
        {showBack && <BackButton onClick={back} />}

        {screen === 20 && <Splash onStart={() => setScreen(21)} />}
        {screen === 21 && (
          <Carousel
            page={page}
            onContinue={() => (page === 0 ? setPage(1) : setScreen(6))}
            onSkip={() => setScreen(6)}
          />
        )}
        {screen === 6 && (
          <Connect
            googleConfigured={googleConfigured}
            onGoogle={connectCalendar}
            onOther={() => setScreen(1)}
          />
        )}
        {screen === 1 && (
          <PhoneStep
            phone={phone}
            setPhone={setPhone}
            onContinue={() => setScreen(13)}
          />
        )}
        {screen === 13 && (
          <MusicStep
            genres={genres}
            genreInput={genreInput}
            setGenreInput={setGenreInput}
            addGenres={addGenres}
            removeGenre={(i) =>
              setGenres((g) => g.filter((_, idx) => idx !== i))
            }
            busy={busy}
            onContinue={async () => {
              await persist();
              setScreen(5);
            }}
          />
        )}
        {screen === 5 && <Scoring />}
        {screen === 14 && <ThisWeek onEnter={() => router.push("/week")} />}

        {showChrome && <HomeIndicator />}
      </div>
    </div>
  );
}

/* ── persistent chrome ──────────────────────────────────────────────── */
function StatusBar() {
  return (
    <div style={styles.statusBar}>
      <span style={{ fontWeight: 600 }}>9:41</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Glyph d="M1 5h2v3H1zM4 3h2v5H4zM7 1h2v7H7z" w={10} h={9} />
        <Glyph
          d="M8 2.5C5.9 2.5 4 3.4 2.7 4.8l1 1C4.7 4.7 6.2 4 8 4s3.3.7 4.3 1.8l1-1C12 3.4 10.1 2.5 8 2.5zM8 6c-1 0-1.9.4-2.5 1l1 1c.4-.4.9-.6 1.5-.6s1.1.2 1.5.6l1-1C9.9 6.4 9 6 8 6z"
          w={16}
          h={9}
        />
        <span style={styles.battery} />
      </span>
    </div>
  );
}
function Glyph({ d, w, h }: { d: string; w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill={INK}>
      <path d={d} />
    </svg>
  );
}
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Back"
      onClick={onClick}
      className="ob-press"
      style={{ ...styles.backBtn, color: INK }}
    >
      <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
        <path
          d="M9.5 1.5 2 9l7.5 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
function HomeIndicator() {
  return <div style={styles.homeIndicator} />;
}

/* ── primary CTA ────────────────────────────────────────────────────── */
function CTA({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="ob-press"
      style={{ ...styles.cta, opacity: disabled ? 0.6 : 1 }}
    >
      {children}
    </button>
  );
}

/* ── screen 20: welcome splash ──────────────────────────────────────── */
function Splash({ onStart }: { onStart: () => void }) {
  return (
    <div style={styles.splash} className="ob-screen">
      <div style={styles.splashGradient} />
      <div style={styles.splashNoise} />
      <div style={styles.splashInner}>
        <div style={styles.wordmark}>
          <span style={styles.markBars}>
            <i style={{ height: 10 }} />
            <i style={{ height: 18 }} />
            <i style={{ height: 14 }} />
            <i style={{ height: 22 }} />
          </span>
          <span style={{ fontFamily: serif, fontSize: 26, color: "#fff" }}>
            Soun<span style={{ color: LIME }}>d</span>ay
          </span>
        </div>

        <h1 style={styles.splashHeadline}>
          Start <em style={{ fontStyle: "italic" }}>calm.</em> Stay{" "}
          <em style={{ fontStyle: "italic" }}>focused.</em> Finish{" "}
          <em style={{ fontStyle: "italic" }}>strong.</em>
        </h1>
        <p style={styles.splashSub}>
          Your calendar turned into the soundtrack that gets you ready for
          what&apos;s next.
        </p>

        <div style={styles.pillRow}>
          {["Calendar-aware", "Backed by science", "Made for your day"].map(
            (p) => (
              <span key={p} style={styles.frostPill}>
                {p}
              </span>
            ),
          )}
        </div>

        <button onClick={onStart} className="ob-press" style={styles.splashCta}>
          Learn more →
        </button>
      </div>
    </div>
  );
}

/* ── screen 21: carousel ────────────────────────────────────────────── */
const PANELS = [
  {
    title: "The right music to perform. Backed by science.",
    body: "Connect your calendar and Sounday builds your personal soundtrack before the week begins.",
  },
  {
    title: "Music that knows your schedule",
    body: "Back-to-back meetings get calm, grounding tracks. High-stakes moments get a confidence-priming Prime track.",
  },
];
function Carousel({
  page,
  onContinue,
  onSkip,
}: {
  page: 0 | 1;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <div style={styles.carousel} className="ob-screen">
      <button onClick={onSkip} className="ob-press" style={styles.skip}>
        Skip
      </button>

      <div style={styles.carTrackViewport}>
        <div
          style={{
            ...styles.carTrack,
            transform: `translateX(-${page * 50}%)`,
          }}
        >
          {PANELS.map((p, i) => (
            <div key={i} style={styles.carPanel}>
              <Illustration variant={i as 0 | 1} />
              <h2 style={styles.carTitle}>{p.title}</h2>
              <p style={styles.carBody}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.carFooter}>
        <CTA onClick={onContinue}>{page === 0 ? "Continue" : "Get Started"}</CTA>
        <div style={styles.dots}>
          <span style={page === 0 ? styles.dotActive : styles.dotOff} />
          <span style={page === 1 ? styles.dotActive : styles.dotOff} />
        </div>
      </div>
    </div>
  );
}
function Illustration({ variant }: { variant: 0 | 1 }) {
  return (
    <div style={styles.illoWrap}>
      <div style={styles.illoBlob} />
      <div style={styles.illoCircle}>
        {variant === 0 ? (
          <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
            <rect x="20" y="24" width="52" height="46" rx="9" fill="#fff" />
            <rect x="20" y="24" width="52" height="13" rx="9" fill={TEAL} />
            <circle cx="34" cy="52" r="4" fill={GREEN} />
            <circle cx="46" cy="52" r="4" fill={DOT_OFF} />
            <circle cx="58" cy="52" r="4" fill={DOT_OFF} />
            <circle cx="34" cy="62" r="4" fill={DOT_OFF} />
            <circle cx="46" cy="62" r="4" fill={TEAL} />
          </svg>
        ) : (
          <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
            <path
              d="M30 64V34l34-6v30"
              stroke={INK}
              strokeWidth="4"
              fill="none"
              strokeLinejoin="round"
            />
            <circle cx="30" cy="64" r="7" fill={TEAL} />
            <circle cx="64" cy="58" r="7" fill={GREEN} />
          </svg>
        )}
      </div>
    </div>
  );
}

/* ── screen 6: connect calendar ─────────────────────────────────────── */
function Connect({
  googleConfigured,
  onGoogle,
  onOther,
}: {
  googleConfigured: boolean;
  onGoogle: () => void;
  onOther: () => void;
}) {
  return (
    <div style={styles.bodyPad} className="ob-screen">
      <h1 style={styles.h1}>First, let&apos;s see your week.</h1>
      <p style={styles.privacy}>
        Sounday reads event titles, times, and duration only. Processed in memory
        and immediately discarded. Your meetings stay yours.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
        <ConnectCard
          name="Google Calendar"
          tile={<GoogleLogo />}
          action={googleConfigured ? "Connect" : "Demo"}
          onClick={onGoogle}
        />
        <ConnectCard
          name="Microsoft Outlook"
          tile={<OutlookLogo />}
          action="Soon"
          onClick={onOther}
        />
      </div>

      <button onClick={onOther} className="ob-press" style={styles.icsLink}>
        Upload an ICS file instead
      </button>
    </div>
  );
}
function ConnectCard({
  name,
  tile,
  action,
  onClick,
}: {
  name: string;
  tile: React.ReactNode;
  action: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="ob-press" style={styles.connectCard}>
      <span style={styles.iconTile}>{tile}</span>
      <span style={{ flex: 1, textAlign: "left", fontWeight: 600, fontSize: 16 }}>
        {name}
      </span>
      <span style={{ color: MUTED, fontSize: 14 }}>{action}</span>
      <Chevron />
    </button>
  );
}
function Chevron() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" style={{ marginLeft: 8 }}>
      <path
        d="M1 1l6 6-6 6"
        stroke="rgba(20,32,26,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function GoogleLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.98 21.98 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}
function OutlookLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48">
      <rect x="6" y="12" width="24" height="24" rx="3" fill="#0A2767" />
      <ellipse cx="18" cy="24" rx="6.5" ry="7.5" fill="#fff" />
      <ellipse cx="18" cy="24" rx="3.2" ry="4" fill="#0A2767" />
      <rect x="30" y="15" width="13" height="18" rx="2" fill="#0364B8" />
    </svg>
  );
}

/* ── screen 1: phone number ─────────────────────────────────────────── */
function PhoneStep({
  phone,
  setPhone,
  onContinue,
}: {
  phone: string;
  setPhone: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <div style={styles.bodyPad} className="ob-screen">
      <h1 style={styles.h1}>Where should we ping you?</h1>
      <div style={{ marginTop: 28 }}>
        <input
          style={styles.underlineField}
          type="tel"
          inputMode="tel"
          placeholder="Phone number (for SMS prep tracks)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p style={styles.caption}>Optional — you can add this later.</p>
      </div>
      <div style={styles.footerPad}>
        <CTA onClick={onContinue}>Continue</CTA>
      </div>
    </div>
  );
}

/* ── screen 13: music taste ─────────────────────────────────────────── */
function MusicStep({
  genres,
  genreInput,
  setGenreInput,
  addGenres,
  removeGenre,
  busy,
  onContinue,
}: {
  genres: string[];
  genreInput: string;
  setGenreInput: (v: string) => void;
  addGenres: (raw: string) => void;
  removeGenre: (i: number) => void;
  busy: boolean;
  onContinue: () => void;
}) {
  const full = genres.length >= MAX_GENRES;
  return (
    <div style={styles.bodyPad} className="ob-screen">
      <h1 style={styles.h1}>Your music taste</h1>
      <p style={styles.caption}>
        Add up to {MAX_GENRES} genres or artists — by typing or voice. We use them
        as a style hint while keeping each track&apos;s mood. Optional.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <input
          style={styles.fieldFill}
          placeholder="e.g. lo-fi, ambient, house"
          value={genreInput}
          disabled={full}
          onChange={(e) => setGenreInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (genreInput.trim()) addGenres(genreInput);
            }
          }}
        />
        <button
          onClick={() => genreInput.trim() && addGenres(genreInput)}
          disabled={full}
          className="ob-press"
          style={styles.addBtn}
        >
          Add
        </button>
      </div>

      <button className="ob-press" style={styles.voiceBtn} disabled>
        🎙 Add by voice
      </button>

      <div style={styles.counterRow}>
        <span style={{ color: MUTED, fontSize: 13 }}>
          {genres.length === 0
            ? "No genres yet — your tracks will use the day's mood."
            : "Tap a chip to remove it."}
        </span>
        <span style={{ color: MUTED, fontSize: 13 }}>
          {genres.length}/{MAX_GENRES}
        </span>
      </div>

      <div style={styles.chipWrap}>
        {genres.map((g, i) => (
          <button
            key={`${g}-${i}`}
            onClick={() => removeGenre(i)}
            className="ob-press"
            style={styles.genreChip}
          >
            {g} <span style={{ opacity: 0.6 }}>×</span>
          </button>
        ))}
      </div>

      <div style={styles.footerPad}>
        <CTA onClick={onContinue} disabled={busy}>
          {busy ? "Saving…" : "See my week"}
        </CTA>
      </div>
    </div>
  );
}

/* ── screen 5: calendar scoring (transitional) ──────────────────────── */
function Scoring() {
  return (
    <div style={styles.scoring} className="ob-screen">
      <div style={styles.rippleWrap}>
        <span style={{ ...styles.ripple, animationDelay: "0s" }} />
        <span style={{ ...styles.ripple, animationDelay: "1.2s" }} />
        <span style={styles.check}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <path
              d="M8 17.5l6 6 12-13"
              stroke="#fff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <h1 style={{ ...styles.h1, textAlign: "center", marginTop: 40 }}>
        Your week is in.
      </h1>
      <p style={{ ...styles.caption, textAlign: "center" }}>
        Sounday is scoring your week now.
      </p>
      <div style={styles.eq}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              borderRadius: 3,
              background: TEAL,
              animation: "sdEq 1s ease-in-out infinite",
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── screen 14: this week in sound ──────────────────────────────────── */
function ThisWeek({ onEnter }: { onEnter: () => void }) {
  return (
    <div style={{ ...styles.bodyPad, paddingBottom: 110, overflowY: "auto" }} className="ob-screen">
      <p style={styles.eyebrow}>YOUR WEEK</p>
      <h1 style={styles.h1}>This week in sound</h1>

      <div style={styles.curveCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <strong style={{ fontSize: 15 }}>Your stress curve</strong>
          <span style={{ color: MUTED, fontSize: 12 }}>daily load · 0–100</span>
        </div>
        <p style={{ color: MUTED, fontSize: 12, margin: "2px 0 10px" }}>
          Tap a point to see the day.
        </p>
        <StressCurve />
      </div>

      <DayBlock
        title="Monday, Jun 22"
        sub="Light · load 25"
        events={[
          { time: "9:30", name: "Team standup" },
          { time: "11:00", name: "1:1 with manager" },
        ]}
      />
      <div style={styles.dayHeader}>
        <strong style={{ fontSize: 15 }}>Tuesday, Jun 23</strong>
        <span style={{ color: TEAL, fontSize: 13 }}>Busy · load 62 · suggests wind-down</span>
      </div>

      <div style={styles.pinnedCta}>
        <CTA onClick={onEnter}>Enter Sounday</CTA>
      </div>
    </div>
  );
}
function DayBlock({
  title,
  sub,
  events,
}: {
  title: string;
  sub: string;
  events: { time: string; name: string }[];
}) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={styles.dayHeader}>
        <strong style={{ fontSize: 15 }}>{title}</strong>
        <span style={{ color: MUTED, fontSize: 13 }}>{sub}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {events.map((e) => (
          <div key={e.name} style={styles.eventCard}>
            <span style={{ color: MUTED, fontSize: 13, width: 44 }}>{e.time}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{e.name}</span>
            <span style={styles.windDown}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: GREEN }} />
              Wind-down
            </span>
            <Chevron />
          </div>
        ))}
      </div>
    </div>
  );
}
function StressCurve() {
  const loads = [25, 62, 88, 70, 48, 30, 22]; // Mon–Sun, Wed peak
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const W = 300;
  const H = 96;
  const pad = 8;
  const max = 100;
  const pts = loads.map((l, i) => {
    const x = pad + (i * (W - pad * 2)) / (loads.length - 1);
    const y = H - pad - (l / max) * (H - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z`;
  const peak = pts[2];
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
        <defs>
          <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity="0.35" />
            <stop offset="100%" stopColor={GREEN} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#curveFill)" />
        <path d={line} fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={peak[0]} cy={peak[1]} r="9" fill={GREEN} opacity="0.35" />
        <circle cx={peak[0]} cy={peak[1]} r="4.5" fill={INK} />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {days.map((d) => (
          <span
            key={d}
            style={{
              fontSize: 11,
              color: d === "Wed" ? INK2 : MUTED,
              fontWeight: d === "Wed" ? 700 : 400,
            }}
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  stage: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e7ebe6",
  },
  phone: {
    position: "relative",
    width: "min(100vw, 402px)",
    height: "min(100vh, 874px)",
    overflow: "hidden",
    color: INK,
    borderRadius: 46,
    boxShadow: "0 30px 80px rgba(20,32,26,0.18)",
  },
  statusBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 26px",
    fontSize: 14,
    zIndex: 5,
  },
  battery: {
    width: 22,
    height: 11,
    border: `1px solid ${INK}`,
    borderRadius: 3,
    background: `linear-gradient(90deg, ${INK} 70%, transparent 70%)`,
    display: "inline-block",
  },
  backBtn: {
    position: "absolute",
    top: 58,
    left: 20,
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    zIndex: 6,
  },
  homeIndicator: {
    position: "absolute",
    bottom: 8,
    left: "50%",
    transform: "translateX(-50%)",
    width: 135,
    height: 5,
    borderRadius: 99,
    background: "rgba(20,32,26,0.25)",
    zIndex: 6,
  },
  cta: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    background: DARK,
    color: "#fff",
    fontWeight: 600,
    fontSize: 16,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(38,50,56,0.28)",
  },
  /* splash */
  splash: { position: "absolute", inset: 0, overflow: "hidden" },
  splashGradient: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(176deg, #0a3b2c, #115239, #1d7a4e, #3da75f, #7ccf6d, #BBE96B, #D6F56E)",
    backgroundSize: "200% 200%",
    animation: "sdGradient 22s ease infinite",
  },
  splashNoise: {
    position: "absolute",
    inset: 0,
    opacity: 0.06,
    backgroundImage:
      "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
    backgroundSize: "3px 3px",
  },
  splashInner: {
    position: "relative",
    zIndex: 2,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "84px 30px 44px",
  },
  wordmark: { display: "flex", alignItems: "center", gap: 10 },
  markBars: { display: "flex", alignItems: "flex-end", gap: 3, height: 22 },
  splashHeadline: {
    fontFamily: serif,
    fontSize: 44,
    lineHeight: 1.08,
    color: "#fff",
    fontWeight: 400,
    margin: "auto 0 0",
    letterSpacing: "-0.01em",
  },
  splashSub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 1.5,
    margin: "16px 0 0",
    maxWidth: 320,
  },
  pillRow: { display: "flex", flexWrap: "wrap", gap: 8, margin: "22px 0 24px" },
  frostPill: {
    background: "rgba(255,255,255,0.16)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.25)",
    color: "#fff",
    fontSize: 13,
    padding: "8px 14px",
    borderRadius: 999,
  },
  splashCta: {
    height: 56,
    borderRadius: 28,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 16,
    color: "#13391f",
    background: `linear-gradient(95deg, ${LIME}, ${GREEN})`,
    boxShadow: "0 12px 30px rgba(214,245,110,0.4)",
  },
  /* carousel */
  carousel: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    padding: "0 0 40px",
  },
  skip: {
    position: "absolute",
    top: 56,
    right: 22,
    background: "transparent",
    border: "none",
    color: "rgba(20,32,26,0.45)",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    zIndex: 6,
  },
  carTrackViewport: { flex: 1, overflow: "hidden", marginTop: 96 },
  carTrack: {
    display: "flex",
    width: "200%",
    height: "100%",
    transition: "transform 480ms cubic-bezier(0.22,0.61,0.36,1)",
  },
  carPanel: {
    width: "50%",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 24px",
  },
  illoWrap: {
    position: "relative",
    width: 200,
    height: 200,
    marginBottom: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  illoBlob: {
    position: "absolute",
    inset: 8,
    borderRadius: "50%",
    background: "radial-gradient(circle at 40% 35%, #d8f6df, #b6ecc4)",
  },
  illoCircle: {
    position: "relative",
    width: 168,
    height: 168,
    borderRadius: "50%",
    background: "#eafaef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 0 1px rgba(14,158,142,0.12)",
  },
  carTitle: {
    fontSize: 27,
    fontWeight: 700,
    textAlign: "center",
    color: INK2,
    letterSpacing: "-0.01em",
    margin: 0,
    lineHeight: 1.18,
  },
  carBody: {
    fontSize: 15,
    color: MUTED,
    textAlign: "center",
    lineHeight: 1.6,
    margin: "12px 0 0",
  },
  carFooter: { padding: "0 24px", display: "flex", flexDirection: "column", gap: 18 },
  dots: { display: "flex", gap: 8, justifyContent: "center", alignItems: "center" },
  dotActive: { width: 22, height: 8, borderRadius: 99, background: GREEN },
  dotOff: { width: 8, height: 8, borderRadius: 99, background: DOT_OFF },
  /* shared body */
  bodyPad: {
    position: "absolute",
    inset: 0,
    padding: "104px 24px 40px",
    display: "flex",
    flexDirection: "column",
  },
  h1: { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.15, color: INK2 },
  privacy: { color: MUTED, fontSize: 14, lineHeight: 1.6, margin: "12px 0 0" },
  caption: { color: MUTED, fontSize: 13.5, lineHeight: 1.55, margin: "8px 0 0" },
  /* connect */
  connectCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    background: FIELD,
    border: `1px solid ${LINE}`,
    borderRadius: 18,
    padding: "14px 16px",
    cursor: "pointer",
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 11,
    background: "#fff",
    border: `1px solid ${LINE}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  icsLink: {
    background: "transparent",
    border: "none",
    color: TEAL,
    textDecoration: "underline",
    fontSize: 14,
    cursor: "pointer",
    marginTop: 16,
    alignSelf: "flex-start",
    padding: 0,
  },
  /* phone */
  underlineField: {
    width: "100%",
    border: "none",
    borderBottom: `2px solid ${LINE}`,
    background: "transparent",
    padding: "10px 2px",
    fontSize: 17,
    outline: "none",
    color: INK,
  },
  footerPad: { marginTop: "auto" },
  /* music */
  fieldFill: {
    flex: 1,
    background: FIELD,
    border: `1px solid ${LINE}`,
    borderRadius: 14,
    padding: "13px 14px",
    fontSize: 15,
    outline: "none",
    color: INK,
  },
  addBtn: {
    background: TEAL,
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "0 20px",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
  },
  voiceBtn: {
    marginTop: 10,
    width: "100%",
    background: "transparent",
    border: `1px solid ${LINE}`,
    borderRadius: 14,
    padding: "12px",
    fontSize: 15,
    color: INK,
    cursor: "pointer",
  },
  counterRow: { display: "flex", justifyContent: "space-between", marginTop: 14 },
  chipWrap: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 },
  genreChip: {
    background: "rgba(14,158,142,0.1)",
    color: "#0c7d70",
    border: "none",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 14,
    cursor: "pointer",
  },
  /* scoring */
  scoring: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 30px",
  },
  rippleWrap: {
    position: "relative",
    width: 120,
    height: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: `2px solid ${TEAL}`,
    animation: "sdRipple 2.4s ease-out infinite",
  },
  check: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: TEAL,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  eq: { display: "flex", alignItems: "flex-end", gap: 5, height: 36, marginTop: 30 },
  /* this week */
  eyebrow: { color: TEAL, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", margin: "0 0 4px" },
  curveCard: {
    background: "#fff",
    border: `1px solid ${LINE}`,
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
    boxShadow: "0 8px 24px rgba(20,32,26,0.05)",
  },
  dayHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 },
  eventCard: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    border: `1px solid ${LINE}`,
    borderRadius: 16,
    padding: "12px 14px",
  },
  windDown: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(134,223,141,0.18)",
    color: "#1f7a3f",
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 999,
  },
  pinnedCta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "16px 24px 28px",
    background: `linear-gradient(180deg, rgba(249,250,247,0), ${BG} 30%)`,
  },
};

const CSS = `
@keyframes sdGradient { 0%{background-position:0% 0%} 50%{background-position:100% 100%} 100%{background-position:0% 0%} }
@keyframes obFade { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
@keyframes sdScreenFade { from{opacity:0} to{opacity:1} }
@keyframes sdRipple { 0%{transform:scale(0.5); opacity:0.7} 100%{transform:scale(1.4); opacity:0} }
@keyframes sdEq { 0%,100%{height:8px} 50%{height:34px} }
.ob-screen { animation: obFade 600ms cubic-bezier(0.22,0.61,0.36,1) both; }
.ob-press:active { transform: scale(0.98); transition: transform 150ms; }
input::placeholder { color: rgba(20,32,26,0.4); }
`;
