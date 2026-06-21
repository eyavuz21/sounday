"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/* ── design tokens (from the cofounder's onboarding design) ─────────── */
const BG = "#F9FAF7";
const INK = "#14201A";
const INK2 = "#1A1A1A";
const TEAL = "#0E9E8E";
const GREEN = "#86DF8D";
const LIME = "#D6F56E";
const DARK = "#263238";
const FIELD = "#F6F8F4";

const serif = "var(--font-instrument-serif), Georgia, serif";
const nunito = "var(--font-nunito), system-ui, sans-serif";
const nunitoSans = "var(--font-nunito-sans), var(--font-inter), system-ui, sans-serif";
const sf =
  "var(--font-inter), -apple-system, 'SF Pro Text', system-ui, sans-serif";
const sfDisplay =
  "var(--font-inter), -apple-system, 'SF Pro Display', system-ui, sans-serif";

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
        body: JSON.stringify({ phone, musicTaste: genres, onboarded: true }),
      });
    } finally {
      setBusy(false);
    }
  }, [phone, genres]);

  /* scoring screen auto-advances to the week summary after 3.6s */
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
    if (googleConfigured) window.location.href = "/api/google/connect";
    else setScreen(1);
  }

  function back() {
    if (screen === 6) {
      setPage(1);
      setScreen(21);
      return;
    }
    const map: Partial<Record<Screen, Screen>> = { 1: 6, 13: 1, 14: 13 };
    const target = map[screen];
    if (target != null) setScreen(target);
  }

  const canBack = screen === 1 || screen === 6 || screen === 13 || screen === 14;

  return (
    <div style={styles.stage}>
      <style>{CSS}</style>
      <div style={styles.phone}>
        {/* ambient gradient */}
        <div style={styles.ambient} />

        {screen === 20 && <Splash onStart={() => setScreen(21)} />}
        {screen === 21 && (
          <Carousel
            page={page}
            onBack={() => (page === 1 ? setPage(0) : setScreen(20))}
            onSkip={() => setScreen(6)}
            onNext={() => (page === 0 ? setPage(1) : setScreen(6))}
          />
        )}

        <StatusBar />
        {canBack && <BackButton onClick={back} />}
        <HomeIndicator />

        <div style={styles.screenLayer}>
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
        </div>
      </div>
    </div>
  );
}

/* ── persistent chrome ──────────────────────────────────────────────── */
function StatusBar() {
  return (
    <div style={styles.statusBar}>
      <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>9:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: INK }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M1 4.5C4.5 1.2 11.5 1.2 15 4.5" strokeLinecap="round" />
          <path d="M3.5 6.8C6 4.5 10 4.5 12.5 6.8" strokeLinecap="round" />
          <circle cx="8" cy="9.4" r="1" fill="currentColor" stroke="none" />
        </svg>
        <div style={styles.battery}>
          <div style={styles.batteryFill} />
        </div>
      </div>
    </div>
  );
}
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button aria-label="Back" onClick={onClick} className="ob-press" style={styles.backBtn}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
function HomeIndicator() {
  return <div style={styles.homeIndicator} />;
}

/* ── primary dark CTA ───────────────────────────────────────────────── */
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
const SPLASH_PILLS = [
  "Calmer mornings",
  "A 10-minute wind-down before big meetings",
  "The right track, exactly on time",
];
function Splash({ onStart }: { onStart: () => void }) {
  return (
    <div style={styles.splash}>
      <div style={styles.splashBase} />
      <div style={styles.splashNoise} />
      <div style={styles.splashShade} />
      <div style={styles.splashWave1} />
      <div style={styles.splashWave2} />
      <div style={styles.splashInner}>
        <div style={styles.wordmark}>
          <span style={styles.markBars}>
            <i style={{ height: 8 }} />
            <i style={{ height: 14 }} />
            <i style={{ height: 20 }} />
            <i style={{ height: 12 }} />
          </span>
          <span style={styles.wordmarkText}>
            Soun<span style={{ color: LIME }}>d</span>ay
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={styles.splashHeadline}>
            Start <span style={{ fontStyle: "italic" }}>calm.</span>
            <br />
            Stay <span style={{ fontStyle: "italic" }}>focused.</span>
            <br />
            Finish <span style={{ fontStyle: "italic" }}>strong.</span>
          </h1>
          <p style={styles.splashSub}>
            Your calendar turned into the soundtrack that gets you ready for
            what&apos;s next.
          </p>
        </div>

        <div style={styles.pillCol}>
          {SPLASH_PILLS.map((p) => (
            <div key={p} style={styles.frostPill}>
              <span style={styles.pillDot} />
              <span style={styles.pillText}>{p}</span>
            </div>
          ))}
        </div>

        <button onClick={onStart} className="sd-press" style={styles.splashCta}>
          Learn more <span style={{ fontSize: 18 }}>→</span>
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
  onBack,
  onSkip,
  onNext,
}: {
  page: 0 | 1;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <div style={styles.carousel}>
      <div style={styles.carTopBar}>
        <div onClick={onBack} className="sd-press" style={styles.carBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </div>
        {page === 0 && (
          <div onClick={onSkip} className="sd-press" style={styles.carSkip}>
            Skip
          </div>
        )}
      </div>

      <div style={{ ...styles.carTrack, transform: `translateX(${-page * 402}px)` }}>
        {PANELS.map((p, i) => (
          <div key={i} style={styles.carPanel}>
            <div style={styles.illoWrap}>
              <div style={styles.illoBlob} />
              <div style={styles.illoCircle}>
                <Illustration variant={i as 0 | 1} />
              </div>
            </div>
            <h1 style={styles.carTitle}>{p.title}</h1>
            <p style={styles.carBody}>{p.body}</p>
            <div style={{ flex: 1, minHeight: 20 }} />
            <div onClick={onNext} className="sd-press" style={styles.carCta}>
              <span style={styles.carCtaText}>
                {i === 0 ? "Continue" : "Get Started"}
              </span>
            </div>
            <div style={styles.dots}>
              <span style={i === 0 ? styles.dotActive : styles.dotOff} />
              <span style={i === 1 ? styles.dotActive : styles.dotOff} />
            </div>
            <div style={{ flex: 0.42, minHeight: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
const ILLUSTRATIONS = ["/onboarding/carousel-1.png", "/onboarding/carousel-2.png"];
function Illustration({ variant }: { variant: 0 | 1 }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={ILLUSTRATIONS[variant]}
      alt=""
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
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
      <div style={styles.h1Big}>First, let&apos;s see your week.</div>
      <p style={styles.privacy}>
        Sounday reads event titles, times, and duration only. Processed in memory
        and immediately discarded. Your meetings stay yours.
      </p>

      <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 14 }}>
        <ConnectCard
          name="Google Calendar"
          action={googleConfigured ? "Connect" : "Demo"}
          tile={<GoogleLogo />}
          onClick={onGoogle}
        />
        <ConnectCard
          name="Microsoft Outlook"
          action="Connect"
          tile={<OutlookLogo />}
          onClick={onOther}
        />
      </div>

      <div onClick={onOther} className="ob-press" style={styles.icsLink}>
        Upload an ICS file instead
      </div>
      <div style={{ flex: 1 }} />
    </div>
  );
}
function ConnectCard({
  name,
  action,
  tile,
  onClick,
}: {
  name: string;
  action: string;
  tile: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="ob-press ob-card" style={styles.connectCard}>
      <div style={styles.iconTile}>{tile}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16.5, fontWeight: 700, color: INK }}>{name}</div>
        <div style={{ fontSize: 13.5, fontWeight: 300, color: "rgba(20,32,26,0.42)", marginTop: 2 }}>
          {action}
        </div>
      </div>
      <Chevron />
    </div>
  );
}
function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(20,32,26,0.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
function GoogleLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 48 48">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.98 21.98 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}
function OutlookLogo() {
  return (
    <svg width="27" height="27" viewBox="0 0 48 48">
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
      <div style={styles.h1}>Where should we ping you?</div>
      <div style={{ marginTop: 36 }}>
        <label style={styles.fieldLabel}>
          Phone number{" "}
          <span style={{ color: "rgba(20,32,26,0.32)" }}>(for SMS prep tracks)</span>
        </label>
        <input
          type="tel"
          inputMode="tel"
          placeholder="+44 7700 900123"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={styles.underlineField}
        />
        <div style={styles.caption}>Optional — you can add this later.</div>
      </div>
      <div style={{ flex: 1 }} />
      <CTA onClick={onContinue}>Continue</CTA>
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
      <div style={styles.h1}>Your music taste</div>
      <p style={styles.subMuted}>
        Add up to {MAX_GENRES} favourite genres or artists — by typing or voice.
        We use them as a style hint while keeping each track&apos;s mood.
        Optional.
      </p>

      <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
        <input
          type="text"
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
          style={styles.fieldFill}
        />
        <div
          onClick={() => genreInput.trim() && !full && addGenres(genreInput)}
          className="ob-press"
          style={styles.addBtn}
        >
          Add
        </div>
      </div>

      <div style={styles.voiceRow}>
        <div className="ob-press" style={styles.voiceBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
          <span style={{ fontSize: 14.5, fontWeight: 500, color: INK }}>Add by voice</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(20,32,26,0.4)" }}>
          {genres.length}/{MAX_GENRES}
        </div>
      </div>

      {genres.length === 0 ? (
        <div style={styles.emptyNote}>
          No genres yet — optional, but it personalises your tracks.
        </div>
      ) : null}

      <div style={styles.chipWrap}>
        {genres.map((g, i) => (
          <div
            key={`${g}-${i}`}
            onClick={() => removeGenre(i)}
            className="ob-press"
            style={styles.genreChip}
          >
            {g}
            <span style={{ fontSize: 15, lineHeight: 1, opacity: 0.7 }}>×</span>
          </div>
        ))}
      </div>

      <div style={styles.hintNote}>
        We use these as a loose style hint — Wind-down stays calm, Prime stays
        confident. Prefer genres over artists.
      </div>

      <div style={{ flex: 1 }} />
      <CTA onClick={onContinue} disabled={busy}>
        {busy ? "Saving…" : "See my week"}
      </CTA>
    </div>
  );
}

/* ── screen 5: calendar scoring (auto-advances) ─────────────────────── */
const EQ_COLORS = ["#0E9E8E", "#0E9E8E", "#3FBE8E", "#86DF8D", "#C9F46B"];
function Scoring() {
  return (
    <div style={styles.scoring} className="ob-screen">
      <div style={styles.rippleWrap}>
        <span style={{ ...styles.ripple, animationDelay: "0s" }} />
        <span style={{ ...styles.ripple, animationDelay: "1.3s" }} />
        <div style={styles.check}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.01em" }}>
        Your week is in.
      </div>
      <div style={{ fontSize: 15, fontWeight: 300, color: "rgba(20,32,26,0.5)", marginTop: 12 }}>
        Sounday is scoring your week now.
      </div>
      <div style={styles.eq}>
        {EQ_COLORS.map((c, i) => (
          <span
            key={i}
            style={{
              width: 3,
              height: 26,
              background: c,
              borderRadius: 9999,
              transformOrigin: "center",
              animation: "obWave 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
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
    <div style={styles.weekRoot} className="ob-screen">
      <div style={styles.weekScroll}>
        <div style={styles.eyebrow}>Your week</div>
        <div style={styles.weekTitle}>This week in sound</div>

        <div style={styles.curveCard}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: INK2 }}>Your stress curve</div>
            <div style={{ fontSize: 11.5, color: "rgba(20,32,26,0.4)" }}>daily load · 0–100</div>
          </div>
          <div style={{ fontSize: 13, color: "rgba(20,32,26,0.45)", marginTop: 5 }}>
            Tap a point to see the day.
          </div>
          <StressCurve />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px 0" }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span
                key={d}
                style={{
                  fontSize: 11.5,
                  fontWeight: d === "Wed" ? 700 : 400,
                  color: d === "Wed" ? INK : "rgba(20,32,26,0.42)",
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={styles.dayName}>Monday, Jun 22</div>
          <div style={styles.dayMeta}>Light · load 25</div>
        </div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 11 }}>
          <EventCard time="9:30 AM" dur="30m" name="Team standup" />
          <EventCard time="11:00 AM" dur="30m" name="1:1 with manager" />
        </div>

        <div style={{ marginTop: 26 }}>
          <div style={styles.dayName}>Tuesday, Jun 23</div>
          <div style={styles.dayMeta}>
            Busy · load 62 ·{" "}
            <span style={{ color: TEAL, fontWeight: 600 }}>suggests wind-down</span>
          </div>
        </div>
      </div>

      <div style={styles.pinnedCta}>
        <CTA onClick={onEnter}>Enter Sounday</CTA>
      </div>
    </div>
  );
}
function EventCard({ time, dur, name }: { time: string; dur: string; name: string }) {
  return (
    <div className="ob-press" style={styles.eventCard}>
      <div style={{ flex: "none", width: 54 }}>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.15, color: INK2 }}>{time}</div>
        <div style={{ fontSize: 12, color: "rgba(20,32,26,0.4)", marginTop: 2 }}>{dur}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, color: INK2 }}>{name}</div>
        <div style={styles.windDown}>
          <span style={{ width: 5, height: 5, borderRadius: 9999, background: TEAL }} />
          Wind-down
        </div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(20,32,26,0.28)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </div>
  );
}
function StressCurve() {
  return (
    <svg viewBox="0 0 332 150" style={{ width: "100%", height: "auto", marginTop: 16, display: "block" }} fill="none">
      <defs>
        <linearGradient id="wkArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GREEN} stopOpacity="0.32" />
          <stop offset="1" stopColor={GREEN} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="16" y1="42" x2="316" y2="42" stroke="rgba(20,32,26,0.07)" strokeWidth="1" strokeDasharray="3 5" />
      <line x1="16" y1="86" x2="316" y2="86" stroke="rgba(20,32,26,0.07)" strokeWidth="1" strokeDasharray="3 5" />
      <line x1="16" y1="130" x2="316" y2="130" stroke="rgba(20,32,26,0.07)" strokeWidth="1" strokeDasharray="3 5" />
      <path d="M16,130 L16,102.5 L66,69.5 L116,33.2 L166,80.5 L216,86 L266,116.8 L316,116.8 L316,130 Z" fill="url(#wkArea)" />
      <polyline points="16,102.5 66,69.5 116,33.2 166,80.5 216,86 266,116.8 316,116.8" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {[
        [16, 102.5],
        [66, 69.5],
        [166, 80.5],
        [216, 86],
        [266, 116.8],
        [316, 116.8],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="5.5" fill="#fff" stroke={TEAL} strokeWidth="2.5" />
      ))}
      <circle cx="116" cy="33.2" r="13" fill="rgba(14,158,142,0.14)" />
      <circle cx="116" cy="33.2" r="7" fill={INK} stroke="#fff" strokeWidth="2.5" />
    </svg>
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
    background: "radial-gradient(circle at 50% 28%, #2b332f, #15191b)",
    padding: 24,
    boxSizing: "border-box",
    fontFamily: sf,
  },
  phone: {
    position: "relative",
    width: 402,
    maxWidth: "100%",
    height: "min(860px, calc(100vh - 48px))",
    overflow: "hidden",
    background: "#FFFFFF",
    borderRadius: 46,
    boxShadow: "0 40px 110px -24px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.04)",
    color: INK,
  },
  ambient: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(70% 38% at 50% 0%, rgba(134,223,141,0.14), transparent 62%), radial-gradient(60% 36% at 50% 100%, rgba(14,158,142,0.07), transparent 60%)",
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
    padding: "0 28px",
    zIndex: 20,
  },
  battery: {
    width: 23,
    height: 11,
    border: "1px solid rgba(20,32,26,0.45)",
    borderRadius: 3,
    position: "relative",
    padding: 1.5,
    boxSizing: "border-box",
  },
  batteryFill: { width: "70%", height: "100%", background: INK, borderRadius: 1 },
  backBtn: {
    position: "absolute",
    top: 58,
    left: 20,
    zIndex: 20,
    width: 38,
    height: 38,
    borderRadius: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(20,32,26,0.6)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  homeIndicator: {
    position: "absolute",
    bottom: 9,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 20,
    width: 135,
    height: 5,
    borderRadius: 9999,
    background: "rgba(20,32,26,0.22)",
  },
  screenLayer: { position: "absolute", inset: 0, zIndex: 10 },
  cta: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    background: DARK,
    color: "#FFFFFF",
    fontFamily: sfDisplay,
    fontSize: 17,
    fontWeight: 600,
    letterSpacing: "0.01em",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 16px 40px -14px rgba(38,50,56,0.5)",
  },

  /* splash */
  splash: { position: "absolute", inset: 0, overflow: "hidden", zIndex: 40 },
  splashBase: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(176deg, #0a3b2c 0%, #115239 16%, #1d7a4e 38%, #3da75f 58%, #7ccf6d 78%, #BBE96B 92%, #D6F56E 100%)",
    backgroundSize: "200% 200%",
    animation: "flowBase 22s ease-in-out infinite",
  },
  splashNoise: {
    position: "absolute",
    inset: 0,
    opacity: 0.07,
    mixBlendMode: "overlay",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
  },
  splashShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "46%",
    background:
      "linear-gradient(180deg, transparent, rgba(4,32,22,0.32) 60%, rgba(3,26,18,0.5))",
    pointerEvents: "none",
  },
  splashWave1: {
    position: "absolute",
    top: "6%",
    left: "24%",
    width: "46%",
    height: "120%",
    filter: "blur(46px)",
    background:
      "linear-gradient(90deg, transparent, rgba(214,255,107,0.7) 45%, transparent)",
    animation: "flowWave1 16s ease-in-out infinite",
  },
  splashWave2: {
    position: "absolute",
    top: 0,
    left: "34%",
    width: "34%",
    height: "120%",
    filter: "blur(60px)",
    background:
      "linear-gradient(90deg, transparent, rgba(190,245,120,0.5), transparent)",
    animation: "flowWave2 20s ease-in-out infinite",
  },
  splashInner: {
    position: "relative",
    zIndex: 2,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "60px 30px 36px",
    boxSizing: "border-box",
    fontFamily: nunitoSans,
  },
  wordmark: { display: "flex", alignItems: "center", gap: 10 },
  markBars: { display: "flex", alignItems: "flex-end", gap: 2.5, height: 20 },
  wordmarkText: {
    fontFamily: nunito,
    fontSize: 19,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: "#FFFFFF",
  },
  splashHeadline: {
    fontFamily: serif,
    fontSize: 54,
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: 0.92,
    color: "#FBFFF4",
    textShadow: "0 2px 24px rgba(0,40,20,0.18)",
    margin: 0,
  },
  splashSub: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.55,
    color: "#FFFFFF",
    margin: "24px 0 0",
    maxWidth: 300,
  },
  pillCol: { display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 },
  frostPill: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "13px 18px",
    borderRadius: 9999,
    background: "rgba(6,40,28,0.34)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    background: LIME,
    boxShadow: `0 0 8px ${LIME}`,
    flex: "none",
  },
  pillText: { fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.9)" },
  splashCta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: 18,
    boxSizing: "border-box",
    background: "linear-gradient(100deg,#D6F56E,#86DF8D)",
    color: INK,
    borderRadius: 9999,
    border: "none",
    cursor: "pointer",
    fontFamily: nunito,
    fontSize: 16,
    fontWeight: 700,
    boxShadow: "0 12px 34px -12px rgba(20,60,30,0.5)",
  },

  /* carousel */
  carousel: { position: "absolute", inset: 0, zIndex: 30, background: BG },
  carTopBar: {
    position: "absolute",
    top: 52,
    left: 24,
    right: 24,
    zIndex: 20,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  carBack: { display: "flex", alignItems: "center", justifyContent: "center", color: "#888888", cursor: "pointer" },
  carSkip: { fontFamily: sf, fontWeight: 500, fontSize: 16, color: "#888888", letterSpacing: "0.01em", cursor: "pointer" },
  carTrack: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 804,
    height: "100%",
    display: "flex",
    transition: "transform 480ms cubic-bezier(0.22,0.61,0.36,1)",
  },
  carPanel: {
    position: "relative",
    flex: "none",
    width: 402,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "100px 24px 30px",
    boxSizing: "border-box",
  },
  illoWrap: {
    flex: "none",
    marginTop: 6,
    width: 300,
    height: 258,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  illoBlob: {
    position: "absolute",
    width: 262,
    height: 226,
    background:
      "radial-gradient(circle at 50% 45%, #CFEED9 0%, #D9F2E0 55%, rgba(217,242,224,0) 78%)",
    borderRadius: "54% 46% 57% 43% / 52% 48% 52% 48%",
    filter: "blur(2px)",
  },
  illoCircle: {
    position: "relative",
    zIndex: 1,
    width: 252,
    height: 252,
    borderRadius: "50%",
    overflow: "hidden",
    background: "rgba(255,255,255,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    boxSizing: "border-box",
  },
  carTitle: {
    margin: "36px 0 0",
    width: "100%",
    fontFamily: sfDisplay,
    fontWeight: 700,
    fontSize: 27,
    lineHeight: 1.14,
    letterSpacing: "-0.02em",
    color: INK2,
    textAlign: "center",
  },
  carBody: {
    margin: "14px 0 0",
    width: "100%",
    fontFamily: sf,
    fontWeight: 400,
    fontSize: 15,
    lineHeight: 1.6,
    color: "#888888",
    textAlign: "center",
  },
  carCta: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    background: DARK,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 16px 40px -14px rgba(38,50,56,0.5)",
    cursor: "pointer",
  },
  carCtaText: { fontFamily: sfDisplay, fontWeight: 600, fontSize: 17, letterSpacing: "0.01em", color: "#FFFFFF" },
  dots: { display: "flex", alignItems: "center", gap: 8, marginTop: 18 },
  dotActive: { width: 22, height: 8, borderRadius: 9999, background: "#92E3A9" },
  dotOff: { width: 8, height: 8, borderRadius: 9999, background: "#D7DAD9" },

  /* shared body */
  bodyPad: {
    position: "absolute",
    inset: 0,
    padding: "104px 32px 34px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  h1: { fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 },
  h1Big: { fontSize: 28, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2 },
  privacy: { fontSize: 15, fontWeight: 300, lineHeight: 1.55, color: "rgba(20,32,26,0.5)", margin: "14px 0 0" },
  subMuted: { fontSize: 14, fontWeight: 300, lineHeight: 1.55, color: "rgba(20,32,26,0.5)", margin: "14px 0 0" },
  caption: { fontSize: 13, fontWeight: 300, color: "rgba(20,32,26,0.42)", marginTop: 12 },

  /* connect */
  connectCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 20,
    background: FIELD,
    border: "1px solid rgba(20,32,26,0.07)",
    cursor: "pointer",
  },
  iconTile: {
    flex: "none",
    width: 46,
    height: 46,
    borderRadius: 13,
    background: "#FFFFFF",
    boxShadow: "0 2px 8px -2px rgba(20,32,26,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  icsLink: {
    alignSelf: "center",
    marginTop: 26,
    fontSize: 14.5,
    fontWeight: 400,
    color: "rgba(20,32,26,0.55)",
    textDecoration: "underline",
    textUnderlineOffset: 3,
    cursor: "pointer",
  },

  /* phone */
  fieldLabel: { fontSize: 12, fontWeight: 400, color: "rgba(20,32,26,0.45)" },
  underlineField: {
    width: "100%",
    marginTop: 10,
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(20,32,26,0.18)",
    color: INK,
    fontSize: 18,
    fontWeight: 300,
    padding: "10px 0",
    outline: "none",
  },

  /* music */
  fieldFill: {
    flex: 1,
    minWidth: 0,
    background: FIELD,
    border: "1px solid rgba(20,32,26,0.12)",
    borderRadius: 14,
    color: INK,
    fontSize: 15,
    fontWeight: 300,
    padding: "14px 16px",
    outline: "none",
  },
  addBtn: {
    flex: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 20px",
    border: "1px solid rgba(14,158,142,0.4)",
    borderRadius: 14,
    color: TEAL,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  voiceRow: { marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" },
  voiceBtn: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "11px 18px",
    border: "1px solid rgba(20,32,26,0.14)",
    borderRadius: 14,
    cursor: "pointer",
  },
  emptyNote: { fontSize: 13.5, fontWeight: 300, color: "rgba(20,32,26,0.4)", marginTop: 16 },
  chipWrap: { marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 },
  genreChip: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 13px",
    borderRadius: 9999,
    background: "rgba(14,158,142,0.1)",
    border: "1px solid rgba(14,158,142,0.28)",
    color: TEAL,
    fontSize: 13.5,
    fontWeight: 500,
    cursor: "pointer",
  },
  hintNote: { fontSize: 13, fontWeight: 300, lineHeight: 1.5, color: "rgba(20,32,26,0.4)", marginTop: 18 },

  /* scoring */
  scoring: {
    position: "absolute",
    inset: 0,
    padding: "50px 32px 34px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    boxSizing: "border-box",
  },
  rippleWrap: {
    position: "relative",
    width: 96,
    height: 96,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 34,
  },
  ripple: {
    position: "absolute",
    inset: 0,
    borderRadius: 9999,
    border: "1.5px solid rgba(14,158,142,0.5)",
    animation: "obRipple 2.6s ease-out infinite",
  },
  check: {
    width: 72,
    height: 72,
    borderRadius: 9999,
    background: "rgba(14,158,142,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  eq: { display: "flex", alignItems: "flex-end", gap: 4, height: 26, marginTop: 30 },

  /* week */
  weekRoot: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: BG,
    fontFamily: sf,
  },
  weekScroll: {
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    padding: "92px 24px 12px",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: TEAL,
  },
  weekTitle: {
    fontFamily: sfDisplay,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: INK2,
    marginTop: 6,
  },
  curveCard: {
    marginTop: 22,
    borderRadius: 24,
    padding: "22px 20px 18px",
    background: "#FFFFFF",
    border: "1px solid rgba(20,32,26,0.06)",
    boxShadow: "0 14px 38px -22px rgba(20,32,26,0.28)",
  },
  dayName: { fontFamily: sfDisplay, fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", color: INK2 },
  dayMeta: { fontSize: 13, fontWeight: 400, color: "rgba(20,32,26,0.5)", marginTop: 3 },
  eventCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 18px",
    borderRadius: 20,
    background: "#FFFFFF",
    border: "1px solid rgba(20,32,26,0.06)",
    boxShadow: "0 8px 24px -18px rgba(20,32,26,0.3)",
    cursor: "pointer",
  },
  windDown: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
    fontSize: 11.5,
    fontWeight: 600,
    color: TEAL,
    background: "rgba(14,158,142,0.1)",
    padding: "4px 11px",
    borderRadius: 9999,
  },
  pinnedCta: {
    padding: "12px 24px 34px",
    background: "linear-gradient(180deg, rgba(249,250,247,0), #F9FAF7 32%)",
  },
};

const CSS = `
@keyframes obFade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
@keyframes obWave { 0%,100% { transform:scaleY(0.32); } 50% { transform:scaleY(1); } }
@keyframes obRipple { 0% { transform:scale(0.7); opacity:0.6; } 100% { transform:scale(1.9); opacity:0; } }
@keyframes flowBase { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
@keyframes flowWave1 { 0%,100% { transform:translateX(-14%) skewX(-7deg) scaleX(1); opacity:0.9; } 50% { transform:translateX(20%) skewX(6deg) scaleX(1.18); opacity:1; } }
@keyframes flowWave2 { 0%,100% { transform:translateX(12%) skewX(5deg) scaleX(1.1); opacity:0.55; } 50% { transform:translateX(-16%) skewX(-6deg) scaleX(0.9); opacity:0.8; } }
.sd-press { transition: transform 150ms ease, opacity 150ms ease; cursor:pointer; }
.sd-press:active { transform: scale(0.97); }
.ob-screen { animation: obFade 600ms cubic-bezier(0.4,0,0.2,1) both; }
.ob-press { transition: transform 150ms ease, opacity 150ms ease, background 200ms ease, border-color 200ms ease; cursor:pointer; }
.ob-press:active { transform: scale(0.98); }
.ob-card:hover { border-color: rgba(20,32,26,0.22); }
`;
