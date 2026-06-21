import type { EventMode, Feeling } from "./types";
import { modePolarity, modeHasLyrics } from "./modes";

/**
 * Acoustic parameter engine.
 *
 * Turns the day's calendar load + the event mode into concrete musical
 * parameters that carry the *emotion* of the track. Grounded in the
 * expectancy-based model of musical pleasure (Cheung et al., 2019, Current
 * Biology): pleasure peaks either at LOW uncertainty + HIGH surprise, or at
 * HIGH uncertainty + LOW surprise. We pick a target profile per mode and
 * modulate it by how overloaded the day is, then translate the parameters into
 * a text prompt that any music-generation model can consume.
 */

export type Acoustics = {
  tempoBpm: number;
  energy: number; // 0-1
  valence: number; // 0-1 (musical positivity)
  repetition: number; // 0-1 (predictability / groove stability)
  surprise: number; // 0-1 (expectancy violation)
  uncertainty: number; // 0-1 (harmonic/entropic ambiguity)
  timbre: string; // descriptor
  profile: string; // human-readable Cheung quadrant
  calibration?: string | null; // how the user's check-in nudged the recipe
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

function cheungProfile(surprise: number, uncertainty: number): string {
  if (surprise >= 0.55 && uncertainty <= 0.45)
    return "low-uncertainty · high-surprise (anthemic lift)";
  if (uncertainty >= 0.55 && surprise <= 0.45)
    return "high-uncertainty · low-surprise (settling resolution)";
  return "balanced expectation";
}

function withProfile(a: Omit<Acoustics, "profile">): Acoustics {
  return { ...a, profile: cheungProfile(a.surprise, a.uncertainty) };
}

/**
 * Base acoustic recipe per mode, modulated by the day's load.
 *
 * @param mode    one of the five soundtrack modes
 * @param dayLoad 0-100 stress/load score for the event's day
 */
export function acousticsFor(mode: EventMode, dayLoad: number): Acoustics {
  // 0 (light) .. 1 (very overloaded)
  const load = clamp01(dayLoad / 100);

  switch (mode) {
    case "intense":
      // Grounding & priming for high-stakes / back-to-backs: steady, confident,
      // energy held up; heavy days dial back surprise so it grounds, not jolts.
      return withProfile({
        tempoBpm: Math.round(108 - load * 10), // ~98-108 BPM
        energy: round2(0.7 + (1 - load) * 0.08),
        valence: round2(0.7 + (1 - load) * 0.05),
        repetition: round2(0.68 + load * 0.12), // steady, grounding groove
        surprise: round2(0.4 - load * 0.16),
        uncertainty: round2(0.32 - load * 0.06), // clear, anchored
        timbre: "warm grounded low-end, steady driving pulse, confident keys",
      });

    case "focused":
      // Deep-work flow: low-distraction, very predictable, no peaks.
      return withProfile({
        tempoBpm: Math.round(88 - load * 8), // ~80-88 BPM
        energy: round2(0.4 - load * 0.08),
        valence: round2(0.55),
        repetition: round2(0.82 + load * 0.08), // hypnotic stability
        surprise: round2(0.18 - load * 0.06),
        uncertainty: round2(0.42 + load * 0.06),
        timbre: "warm low-distraction keys, soft pads, minimal percussion, no vocals",
      });

    case "social":
      // Bright & open: upbeat, positive, carries you between people and rooms.
      return withProfile({
        tempoBpm: Math.round(116 + (1 - load) * 8), // ~116-124 BPM
        energy: round2(0.74 + (1 - load) * 0.08),
        valence: round2(0.84 + (1 - load) * 0.04),
        repetition: round2(0.5 + load * 0.08),
        surprise: round2(0.58 - load * 0.12),
        uncertainty: round2(0.3 - load * 0.04),
        timbre: "bright open chords, upbeat light percussion, warm brass/synth",
      });

    case "light":
      // Spacious & easy: unhurried recovery for the days that finally breathe.
      return withProfile({
        tempoBpm: Math.round(72 - load * 12), // ~60-72 BPM
        energy: round2(0.28 - load * 0.1),
        valence: round2(0.6 + load * 0.04),
        repetition: round2(0.68 + load * 0.16),
        surprise: round2(0.26 - load * 0.12),
        uncertainty: round2(0.52 + load * 0.08), // gentle, slowly settling
        timbre: "spacious airy pads, unhurried felt piano, soft reverb",
      });

    case "creative":
      // Textured & curious: keeps ideas moving and loose (high surprise + ambiguity).
      return withProfile({
        tempoBpm: Math.round(98 - load * 8), // ~90-98 BPM
        energy: round2(0.58 + (1 - load) * 0.06),
        valence: round2(0.66),
        repetition: round2(0.4 + load * 0.08),
        surprise: round2(0.68 - load * 0.1),
        uncertainty: round2(0.6 + load * 0.05),
        timbre: "textured evolving synths, curious motifs, playful percussion",
      });
  }
}

/** 1-3 chip value → 0..1 "need for help" (1 = lowest/most help, 3 = none). */
const need = (v: number) => clamp01((3 - v) / 2);

/**
 * Calibrate the day-load recipe by how the user actually feels right now.
 *
 * The check-in (ready / calm / confident, each 1-3) shifts the acoustics toward
 * what the person needs: someone who feels unsure/on-edge before a Prime track
 * gets a more grounding, steady, energising lift; someone already calm &
 * confident gets a lighter touch. Wind-down leans harder into soothing when the
 * user is on edge. Returns a new Acoustics with a human-readable `calibration`.
 */
export function calibrateAcoustics(
  base: Acoustics,
  mode: EventMode,
  feeling: Feeling | null | undefined,
): Acoustics {
  if (!feeling) return base;

  const nReady = need(feeling.ready);
  const nCalm = need(feeling.calm);
  const nConf = need(feeling.confident);

  if (modePolarity(mode) === "lift") {
    // Confidence-weighted: the less confident/ready, the bolder the priming.
    const drive = nConf * 0.5 + nReady * 0.3 + nCalm * 0.2;
    const out: Acoustics = {
      ...base,
      tempoBpm: Math.round(base.tempoBpm + drive * 5),
      energy: round2(clamp01(base.energy + drive * 0.12)),
      valence: round2(clamp01(base.valence + drive * 0.08)),
      repetition: round2(clamp01(base.repetition + drive * 0.14)), // steadier groove
      surprise: round2(clamp01(base.surprise - drive * 0.12)), // fewer jolts
      uncertainty: round2(clamp01(base.uncertainty - drive * 0.06)), // clearer
    };
    out.profile = cheungProfile(out.surprise, out.uncertainty);
    out.calibration = calibrationNote(mode, feeling, drive);
    return out;
  }

  // settle modes: calm-weighted soothing.
  const settle = nCalm * 0.5 + nReady * 0.3 + nConf * 0.2;
  const out: Acoustics = {
    ...base,
    tempoBpm: Math.round(base.tempoBpm - settle * 8),
    energy: round2(clamp01(base.energy - settle * 0.1)),
    valence: round2(clamp01(base.valence + settle * 0.04)),
    repetition: round2(clamp01(base.repetition + settle * 0.15)),
    surprise: round2(clamp01(base.surprise - settle * 0.1)),
    uncertainty: round2(clamp01(base.uncertainty + settle * 0.05)),
  };
  out.profile = cheungProfile(out.surprise, out.uncertainty);
  out.calibration = calibrationNote(mode, feeling, settle);
  return out;
}

function lowest(feeling: Feeling): string {
  const entries: [string, number][] = [
    ["less ready", feeling.ready],
    ["on edge", feeling.calm],
    ["unsure", feeling.confident],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

function calibrationNote(
  mode: EventMode,
  feeling: Feeling,
  intensity: number,
): string {
  const lift = modePolarity(mode) === "lift";
  if (intensity < 0.17) {
    return lift
      ? "you feel ready — a lighter, celebratory lift"
      : "you feel calm — a gentle, present touch";
  }
  const focus = lowest(feeling);
  return lift
    ? `tuned for feeling ${focus} — steadier, grounding & more energising`
    : `tuned for feeling ${focus} — slower, softer & more soothing`;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Build a style prompt for a music-generation model from the acoustics. */
export function buildMusicPrompt(
  mode: EventMode,
  a: Acoustics,
  styleHint?: string | null,
): string {
  const lift = modePolarity(mode) === "lift";
  const taste = (styleHint ?? "").trim();
  const tasteClause = taste
    ? lift
      ? ` Inspired by ${taste}, but kept energising and confident.`
      : ` Inspired by ${taste}, but kept low-energy and soothing.`
    : "";

  const vocals = modeHasLyrics(mode) ? "with vocals" : "instrumental";
  const frame = lift
    ? "Energising, uplifting"
    : "Calm, grounded, low-key";

  return (
    `${frame} ${MODE_DESCRIPTOR[mode]} music (${vocals}). Timbre: ${a.timbre}. ` +
    `~${a.tempoBpm} BPM, energy ${pct(a.energy)}, valence ${pct(a.valence)}. ` +
    `Repetition/predictability ${pct(a.repetition)}, harmonic surprise ${pct(
      a.surprise,
    )}, ambiguity ${pct(a.uncertainty)}.` +
    tasteClause
  );
}

const MODE_DESCRIPTOR: Record<EventMode, string> = {
  intense: "grounding, confident, steady-driving",
  focused: "low-distraction deep-focus",
  social: "bright, open, feel-good",
  light: "spacious, unhurried, airy",
  creative: "textured, curious, evolving",
};
