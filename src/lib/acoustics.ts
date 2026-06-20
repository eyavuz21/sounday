import type { EventMode } from "./types";

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

/**
 * @param mode    winddown (calm) or prime (confident)
 * @param dayLoad 0-100 stress/load score for the event's day
 */
export function acousticsFor(mode: EventMode, dayLoad: number): Acoustics {
  // 0 (light) .. 1 (very overloaded)
  const load = clamp01(dayLoad / 100);

  if (mode === "winddown") {
    // The more overloaded the day, the more soothing & predictable the track:
    // slower tempo, lower energy, higher repetition, less surprise.
    const tempoBpm = Math.round(74 - load * 16); // ~74 -> ~58 BPM
    const energy = round2(0.3 - load * 0.14);
    const valence = round2(0.52 + load * 0.06);
    const repetition = round2(0.7 + load * 0.2);
    const surprise = round2(0.28 - load * 0.16);
    const uncertainty = round2(0.55 + load * 0.1); // high-uncertainty · low-surprise comfort
    return {
      tempoBpm,
      energy,
      valence,
      repetition,
      surprise,
      uncertainty,
      timbre: "warm, soft pads, mellow felt piano, airy reverb",
      profile: cheungProfile(surprise, uncertainty),
    };
  }

  // prime: confident & energising. Keep energy high regardless of load, but on
  // very heavy days dial back ambiguity so it feels grounding, not chaotic.
  const tempoBpm = Math.round(122 + (1 - load) * 14); // ~122-136 BPM
  const energy = round2(0.8 + (1 - load) * 0.12);
  const valence = round2(0.78 + (1 - load) * 0.07);
  const repetition = round2(0.45 + load * 0.1);
  const surprise = round2(0.72 - load * 0.18); // bold lifts, fewer on heavy days
  const uncertainty = round2(0.3 - load * 0.08); // stays clear/anthemic
  return {
    tempoBpm,
    energy,
    valence,
    repetition,
    surprise,
    uncertainty,
    timbre: "bright, punchy drums, driving bass, uplifting synth/brass",
    profile: cheungProfile(surprise, uncertainty),
  };
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Build a style prompt for a music-generation model from the acoustics. */
export function buildMusicPrompt(
  mode: EventMode,
  a: Acoustics,
  styleHint?: string | null,
): string {
  const taste = (styleHint ?? "").trim();
  const tasteClause = taste
    ? mode === "winddown"
      ? ` Inspired by ${taste}, but kept low-energy and soothing.`
      : ` Inspired by ${taste}, but kept high-energy and confident.`
    : "";

  if (mode === "winddown") {
    return (
      `Calm, instrumental wind-down music. Timbre: ${a.timbre}. ` +
      `~${a.tempoBpm} BPM, low energy (${pct(a.energy)}). ` +
      `High repetition and predictability (${pct(a.repetition)}), ` +
      `minimal harmonic surprise (${pct(a.surprise)}), gentle unresolved ambiguity ` +
      `that slowly settles (uncertainty ${pct(a.uncertainty)}). No vocals.` +
      tasteClause
    );
  }
  return (
    `Confident, anthemic, motivating track. Timbre: ${a.timbre}. ` +
    `~${a.tempoBpm} BPM, high energy (${pct(a.energy)}), bright major-key feel. ` +
    `Clear, low-ambiguity harmony (uncertainty ${pct(a.uncertainty)}) with bold, ` +
    `surprising lifts and build-ups (surprise ${pct(a.surprise)}); steady, ` +
    `driving groove (repetition ${pct(a.repetition)}).` +
    tasteClause
  );
}
