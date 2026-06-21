import type { EventMode } from "./types";

/**
 * The five soundtrack modes, one per landing-page "mood".
 *
 * `polarity` drives calibration direction: "lift" energises/grounds the track
 * when the user feels low; "settle" leans softer and more soothing. `hasLyrics`
 * marks the prep-style modes that get sung affirmations (others are instrumental).
 */
export type ModePolarity = "lift" | "settle";

export type ModeConfig = {
  mode: EventMode;
  label: string;
  sub: string;
  accent: "sea" | "amber";
  polarity: ModePolarity;
  hasLyrics: boolean;
  dotColor: string;
};

export const MODES: Record<EventMode, ModeConfig> = {
  intense: {
    mode: "intense",
    label: "Intense",
    sub: "Grounding & priming",
    accent: "amber",
    polarity: "lift",
    hasLyrics: true,
    dotColor: "#E8A92E",
  },
  focused: {
    mode: "focused",
    label: "Focused",
    sub: "Deep-work flow",
    accent: "sea",
    polarity: "settle",
    hasLyrics: false,
    dotColor: "#D5CB46",
  },
  social: {
    mode: "social",
    label: "Social",
    sub: "Bright & open",
    accent: "amber",
    polarity: "lift",
    hasLyrics: false,
    dotColor: "#8AC55F",
  },
  light: {
    mode: "light",
    label: "Light",
    sub: "Spacious & easy",
    accent: "sea",
    polarity: "settle",
    hasLyrics: false,
    dotColor: "#36B68A",
  },
  creative: {
    mode: "creative",
    label: "Creative",
    sub: "Textured & curious",
    accent: "amber",
    polarity: "lift",
    hasLyrics: false,
    dotColor: "#2AA0A0",
  },
};

export const MODE_LIST: ModeConfig[] = Object.values(MODES);

export function isEventMode(s: string): s is EventMode {
  return Object.prototype.hasOwnProperty.call(MODES, s);
}

export function modeConfig(m: EventMode): ModeConfig {
  return MODES[m];
}

export function modePolarity(m: EventMode): ModePolarity {
  return MODES[m].polarity;
}

export function modeHasLyrics(m: EventMode): boolean {
  return MODES[m].hasLyrics;
}

export function modeLabel(m: EventMode): string {
  return MODES[m].label;
}
