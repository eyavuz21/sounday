import Link from "next/link";
import EarlyAccessForm from "@/components/landing/EarlyAccessForm";

const serif = "var(--font-newsreader), Georgia, serif";
const sans = "var(--font-inter), system-ui, sans-serif";

const STEPS = [
  {
    n: "1",
    color: "#E8A92E",
    title: "Connect your calendar",
    body: "Connect Google Calendar in a tap — Apple & Outlook coming soon. We use only your event times and titles to shape the sound.",
  },
  {
    n: "2",
    color: "#8AC55F",
    title: "We read the shape of your week",
    body: "Back-to-back, social, open, deep-focus — each day gets a mood, inferred from how full it looks.",
  },
  {
    n: "3",
    color: "#2AA0A0",
    title: "A soundtrack for each event",
    body: "Open any event to generate a track tuned to its mood — and re-tune it whenever your plans shift.",
  },
];

const MOODS = [
  {
    name: "intense",
    dot: "#E8A92E",
    glow: true,
    border: "1px solid rgba(232,169,46,0.45)",
    nameColor: "#E8A92E",
    body: "Grounding, steady tempos to keep you level through the back-to-backs.",
  },
  {
    name: "focused",
    dot: "#D5CB46",
    glow: false,
    border: "1px solid rgba(255,255,255,0.1)",
    nameColor: "#F4F9F5",
    body: "Warm, low-distraction instrumentals for the deep-work stretches.",
  },
  {
    name: "social",
    dot: "#8AC55F",
    glow: false,
    border: "1px solid rgba(255,255,255,0.1)",
    nameColor: "#F4F9F5",
    body: "Bright, open tracks to carry you between the people and the rooms.",
  },
  {
    name: "light",
    dot: "#36B68A",
    glow: false,
    border: "1px solid rgba(255,255,255,0.1)",
    nameColor: "#F4F9F5",
    body: "Spacious, unhurried sounds for the days that finally breathe.",
  },
  {
    name: "creative",
    dot: "#2AA0A0",
    glow: true,
    border: "1px solid rgba(255,255,255,0.1)",
    nameColor: "#F4F9F5",
    body: "Textured, curious music to keep the ideas moving and loose.",
  },
];

export default function LandingPage() {
  return (
    <div
      className="landing"
      style={{
        position: "relative",
        width: "100%",
        overflowX: "hidden",
        background: "#08251c",
        fontFamily: sans,
        color: "#EAF3EE",
      }}
    >
      {/* ===== HERO ===== */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "46px clamp(20px, 5vw, 60px) 56px",
        }}
      >
        {/* mesh background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            filter: "blur(70px)",
            zIndex: 0,
          }}
        >
          <div style={{ position: "absolute", top: "-12%", left: "8%", width: "46vw", height: "46vw", borderRadius: "50%", background: "radial-gradient(circle, #1f6b4e, transparent 68%)", animation: "auroraDrift1 18s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "-8%", left: "14%", width: "14vw", height: "60vh", borderRadius: "50%", background: "radial-gradient(circle, rgba(232,176,58,0.85), transparent 65%)", animation: "auroraDrift3 22s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "18%", right: "6%", width: "42vw", height: "48vw", borderRadius: "50%", background: "radial-gradient(circle, #1a8f6a, transparent 66%)", animation: "auroraDrift2 20s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "-18%", left: "30%", width: "50vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle, #25a07a, transparent 64%)", animation: "auroraDrift1 24s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "8%", left: "-10%", width: "20vw", height: "34vh", borderRadius: "50%", background: "radial-gradient(circle, rgba(232,160,46,0.6), transparent 62%)", animation: "auroraDrift2 26s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "40%", left: "36%", width: "30vw", height: "30vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(120,200,150,0.4), transparent 60%)", animation: "auroraDrift3 19s ease-in-out infinite" }} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(180deg, rgba(6,30,22,0.4) 0%, transparent 28%, transparent 52%, rgba(5,22,16,0.62) 100%)",
          }}
        />

        {/* top bar */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontFamily: serif, fontSize: "30px", fontWeight: 500, letterSpacing: "-0.01em", color: "#F4F9F5" }}>
            Soun<span style={{ color: "#E8A92E" }}>d</span>ay
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "34px" }}>
            <a href="#how" style={{ fontSize: "13px", letterSpacing: "0.04em", color: "rgba(234,243,238,0.8)", textDecoration: "none" }}>How it works</a>
            <a href="#preview" style={{ fontSize: "13px", letterSpacing: "0.04em", color: "rgba(234,243,238,0.8)", textDecoration: "none" }}>Sunday preview</a>
            <a href="#moods" style={{ fontSize: "13px", letterSpacing: "0.04em", color: "rgba(234,243,238,0.8)", textDecoration: "none" }}>Moods</a>
            <a href="#access" aria-label="Early access" style={{ display: "flex", flexDirection: "column", gap: "7px", paddingTop: "4px", cursor: "pointer" }}>
              <span style={{ width: "34px", height: "1.5px", background: "#EAF3EE", display: "block" }} />
              <span style={{ width: "34px", height: "1.5px", background: "#EAF3EE", display: "block" }} />
            </a>
          </div>
        </div>

        {/* right edge meta */}
        <div style={{ position: "absolute", zIndex: 2, right: "26px", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "80px" }}>
          <div style={{ writingMode: "vertical-rl", fontSize: "12px", letterSpacing: "0.2em", color: "rgba(234,243,238,0.7)" }}>© 2026</div>
        </div>

        {/* lower-left block */}
        <div style={{ position: "relative", zIndex: 2, marginTop: "auto", maxWidth: "1300px" }}>
          <div
            style={{
              fontFamily: sans,
              fontSize: "clamp(72px, 17vw, 250px)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 0.82,
              whiteSpace: "nowrap",
              background:
                "linear-gradient(96deg, #F2A93B 4%, #D5CB46 28%, #8AC55F 50%, #36B68A 74%, #2AA0A0 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            SOUNDAY
          </div>

          <p style={{ fontSize: "21px", fontWeight: 300, lineHeight: 1.5, color: "#E3EFE8", maxWidth: "620px", margin: "30px 0 0" }}>
            <span style={{ color: "#F4F9F5", fontWeight: 600 }}>Your calendar, turned into a personal soundtrack</span>{" "}
            — calm tracks when you&apos;re overloaded, a confidence-priming hype song before the big meetings, pinged to your phone right when you need it.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginTop: "36px" }}>
            <Link
              href="/onboarding"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 26px",
                borderRadius: "999px",
                fontSize: "15px",
                fontWeight: 600,
                color: "#08251c",
                textDecoration: "none",
                background:
                  "linear-gradient(96deg, #D5CB46 6%, #8AC55F 52%, #36B68A 100%)",
              }}
            >
              Sign up →
            </Link>
            <Link
              href="/week"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "14px 24px",
                borderRadius: "999px",
                fontSize: "15px",
                fontWeight: 500,
                color: "#EAF3EE",
                textDecoration: "none",
                border: "1px solid rgba(234,243,238,0.28)",
              }}
            >
              Log in
            </Link>
            <Link
              href="/onboarding"
              style={{ fontSize: "15px", fontWeight: 400, color: "#EAF3EE", textDecoration: "none" }}
            >
              See demo →
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", fontSize: "13px", fontWeight: 300, color: "rgba(234,243,238,0.6)", marginTop: "18px" }}>
            <span style={{ width: "24px", height: "1px", background: "rgba(234,243,238,0.3)" }} /> Google Calendar · Apple &amp; Outlook soon
          </div>
        </div>
      </section>

      {/* ===== BODY ===== */}
      <div style={{ position: "relative", background: "#08251c" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 60% at 80% -5%, rgba(43,183,131,0.1), transparent 55%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          {/* headline band */}
          <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "96px clamp(20px, 5vw, 60px) 40px" }}>
            <h1 style={{ fontFamily: serif, fontSize: "clamp(40px, 7vw, 74px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.0, margin: 0, maxWidth: "880px", color: "#F4F9F5" }}>
              Your week, heard before it{" "}
              <span style={{ fontStyle: "italic", background: "linear-gradient(96deg,#E8A92E,#8AC55F,#2AA0A0)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>happens.</span>
            </h1>
          </section>

          {/* how it works */}
          <section id="how" style={{ maxWidth: "1240px", margin: "0 auto", padding: "64px clamp(20px, 5vw, 60px)", borderTop: "1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#E8A92E", fontWeight: 500 }}>How it works</div>
            <h2 style={{ fontFamily: serif, fontSize: "clamp(34px, 5vw, 46px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.05, margin: "18px 0 0", maxWidth: "640px", color: "#F4F9F5" }}>
              Three quiet steps, then it listens with you
            </h2>
            <div style={{ display: "flex", gap: "22px", marginTop: "54px", flexWrap: "wrap" }}>
              {STEPS.map((s) => (
                <div key={s.n} style={{ flex: 1, minWidth: "280px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "36px" }}>
                  <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: "34px", color: s.color }}>{s.n}</div>
                  <h3 style={{ fontSize: "20px", fontWeight: 500, margin: "20px 0 0", color: "#F4F9F5" }}>{s.title}</h3>
                  <p style={{ fontSize: "15px", fontWeight: 300, color: "#9DBBAE", lineHeight: 1.6, margin: "12px 0 0" }}>{s.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* sunday preview */}
          <section id="preview" style={{ maxWidth: "1240px", margin: "0 auto", padding: "64px clamp(20px, 5vw, 60px)", borderTop: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", gap: "72px", flexWrap: "wrap" }}>
            <div style={{ flex: "none", width: "360px", maxWidth: "100%", height: "360px", borderRadius: "36px", position: "relative", overflow: "hidden", background: "#0c2c22", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 60%, rgba(43,183,131,0.22), transparent 62%)" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "relative", width: "140px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "9999px", border: "1.5px solid rgba(138,197,95,0.55)", animation: "auroraRing 2.8s ease-out infinite" }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: "9999px", border: "1.5px solid rgba(138,197,95,0.55)", animation: "auroraRing 2.8s ease-out infinite", animationDelay: "1.4s" }} />
                  <div style={{ width: "96px", height: "96px", borderRadius: "9999px", background: "linear-gradient(140deg,#E8A92E,#36B68A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 50px rgba(43,183,131,0.5)", animation: "auroraBreathe 3.4s ease-in-out infinite" }}>
                    <div style={{ width: 0, height: 0, borderStyle: "solid", borderWidth: "14px 0 14px 24px", borderColor: "transparent transparent transparent #08251c", marginLeft: "6px" }} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <div style={{ fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#E8A92E", fontWeight: 500 }}>Sunday preview</div>
              <h2 style={{ fontFamily: serif, fontSize: "clamp(34px, 5vw, 46px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.05, margin: "18px 0 0", color: "#F4F9F5" }}>
                Hear your week before it begins
              </h2>
              <p style={{ fontSize: "17px", fontWeight: 300, color: "#9DBBAE", lineHeight: 1.62, margin: "22px 0 0", maxWidth: "460px" }}>
                Soon, every Sunday Sounday will render a two-minute flyover of the days ahead — a calm signal to let Monday land a little softer. (Coming soon — for now, generate a soundtrack for any event in your week.)
              </p>
              <div style={{ display: "flex", gap: "9px", marginTop: "32px", maxWidth: "400px" }}>
                {[
                  { d: "Mon", active: false, dim: false },
                  { d: "Tue", active: false, dim: false },
                  { d: "Wed", active: true, dim: false },
                  { d: "Thu", active: false, dim: true },
                  { d: "Fri", active: false, dim: true },
                ].map((day) => (
                  <div
                    key={day.d}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "11px 0",
                      borderRadius: "9999px",
                      background: day.active ? "linear-gradient(120deg,#E8A92E,#36B68A)" : "rgba(255,255,255,0.05)",
                      border: day.active ? "none" : "1px solid rgba(255,255,255,0.1)",
                      fontSize: "13px",
                      fontWeight: day.active ? 600 : 500,
                      color: day.active ? "#08251c" : day.dim ? "#6f8a7e" : "#9DBBAE",
                    }}
                  >
                    {day.d}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* moods */}
          <section id="moods" style={{ maxWidth: "1240px", margin: "0 auto", padding: "64px clamp(20px, 5vw, 60px)", borderTop: "1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "12px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#E8A92E", fontWeight: 500 }}>A sound for every kind of day</div>
              <h2 style={{ fontFamily: serif, fontSize: "clamp(34px, 5vw, 46px)", fontWeight: 400, letterSpacing: "-0.02em", margin: "18px auto 0", maxWidth: "600px", color: "#F4F9F5" }}>
                Five moods, matched to music
              </h2>
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "54px", flexWrap: "wrap" }}>
              {MOODS.map((m) => (
                <div key={m.name} style={{ flex: 1, minWidth: "200px", background: "rgba(255,255,255,0.04)", border: m.border, borderRadius: "24px", padding: "28px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "9999px", background: m.dot, boxShadow: m.glow ? `0 0 10px ${m.dot}` : "none" }} />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: m.nameColor }}>{m.name}</span>
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 300, color: "#9DBBAE", lineHeight: 1.55, margin: "14px 0 0" }}>{m.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* quote */}
          <section style={{ maxWidth: "880px", margin: "0 auto", padding: "88px clamp(20px, 5vw, 60px)", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", height: "30px", marginBottom: "30px" }}>
              <div style={{ width: "3px", height: "13px", background: "rgba(232,169,46,0.6)", borderRadius: "9999px" }} />
              <div style={{ width: "3px", height: "24px", background: "rgba(138,197,95,0.8)", borderRadius: "9999px" }} />
              <div style={{ width: "3px", height: "30px", background: "#36B68A", borderRadius: "9999px" }} />
              <div style={{ width: "3px", height: "20px", background: "rgba(42,160,160,0.8)", borderRadius: "9999px" }} />
              <div style={{ width: "3px", height: "12px", background: "rgba(42,160,160,0.5)", borderRadius: "9999px" }} />
            </div>
            <p style={{ fontFamily: serif, fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 400, fontStyle: "italic", lineHeight: 1.4, letterSpacing: "-0.01em", margin: 0, color: "#F4F9F5" }}>
              &ldquo;It feels less like a music app and more like something quietly setting the tone for my day before I&apos;ve even opened my eyes.&rdquo;
            </p>
            <div style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.06em", color: "#7f9a8e", marginTop: "26px", textTransform: "uppercase" }}>
              Mara L. · early listener
            </div>
          </section>

          {/* cta */}
          <section id="access" style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 60px) 100px" }}>
            <div style={{ borderRadius: "36px", padding: "clamp(48px, 8vw, 80px) clamp(24px, 5vw, 56px)", textAlign: "center", position: "relative", overflow: "hidden", background: "linear-gradient(150deg, #0d3327 0%, #0a2a20 60%)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ position: "absolute", inset: 0, filter: "blur(60px)", opacity: 0.8 }}>
                <div style={{ position: "absolute", bottom: "-30%", left: "20%", width: "40%", height: "80%", borderRadius: "50%", background: "radial-gradient(circle, rgba(232,169,46,0.45), transparent 65%)" }} />
                <div style={{ position: "absolute", bottom: "-30%", right: "18%", width: "42%", height: "85%", borderRadius: "50%", background: "radial-gradient(circle, rgba(54,182,138,0.5), transparent 65%)" }} />
              </div>
              <div style={{ position: "relative" }}>
                <h2 style={{ fontFamily: serif, fontSize: "clamp(38px, 6vw, 54px)", fontWeight: 400, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.0, color: "#F4F9F5" }}>
                  Meet your week, <span style={{ fontStyle: "italic", color: "#E8A92E" }}>gently</span>
                </h2>
                <p style={{ fontSize: "17px", fontWeight: 300, color: "#C5D8CE", lineHeight: 1.6, margin: "22px auto 0", maxWidth: "420px" }}>
                  Join early access and get your first weekly preview this Sunday.
                </p>
                <EarlyAccessForm />
                <div style={{ fontSize: "12px", fontWeight: 300, letterSpacing: "0.04em", color: "#7f9a8e", marginTop: "18px" }}>
                  Free during the beta · We only use your event times &amp; titles — never shared
                </div>
              </div>
            </div>
          </section>

          {/* footer */}
          <footer style={{ borderTop: "1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "36px clamp(20px, 5vw, 60px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "18px" }}>
              <div style={{ fontFamily: serif, fontSize: "22px", fontWeight: 500, letterSpacing: "-0.01em", color: "#F4F9F5" }}>
                Soun<span style={{ color: "#E8A92E" }}>d</span>ay
              </div>
              <div style={{ display: "flex", gap: "28px" }}>
                <Link href="/onboarding" style={{ fontSize: "13px", fontWeight: 300, color: "#7f9a8e", textDecoration: "none" }}>Take the tour</Link>
                <Link href="/settings" style={{ fontSize: "13px", fontWeight: 300, color: "#7f9a8e", textDecoration: "none" }}>Settings</Link>
                <Link href="/week" style={{ fontSize: "13px", fontWeight: 300, color: "#7f9a8e", textDecoration: "none" }}>Demo week</Link>
                <a href="#access" style={{ fontSize: "13px", fontWeight: 300, color: "#7f9a8e", textDecoration: "none" }}>Early access</a>
              </div>
              <div style={{ fontSize: "12px", fontWeight: 300, letterSpacing: "0.06em", color: "#5c7468", textTransform: "uppercase" }}>
                Adaptive weekly sound
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
