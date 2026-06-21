import {
  acousticsFor,
  calibrateAcoustics,
  buildMusicPrompt,
  type Acoustics,
} from "../acoustics";
import type { EventMode, Feeling } from "../types";
import { generateTrack as sunoGenerate, fallbackTrack } from "./suno";
import { pickTrack, spotifyConfigured } from "./spotify";
import { generateMusicElevenLabs, elevenLabsConfigured } from "./elevenlabs";
import { generateMusicReplicate, replicateConfigured } from "./replicate";

/**
 * Provider-agnostic music orchestrator.
 *
 * Builds the acoustic target (from calendar load + mode) and the style prompt,
 * then routes to the best available provider by which API key is present:
 *   Suno → ElevenLabs Music → Replicate MusicGen → Spotify (select) → sample.
 * Every step falls through on failure so the demo never breaks.
 */

export type MusicProvider =
  | "suno"
  | "elevenlabs"
  | "replicate"
  | "spotify"
  | "sample";

export type MusicResult = {
  provider: MusicProvider;
  kind: "audio" | "spotify"; // how the player should render it
  trackUrl: string;
  title: string;
  acoustics: Acoustics;
  note?: string | null;
};

export function activeMusicProvider(): MusicProvider {
  if (process.env.SUNO_API_KEY?.trim()) return "suno";
  if (elevenLabsConfigured()) return "elevenlabs";
  if (replicateConfigured()) return "replicate";
  if (spotifyConfigured()) return "spotify";
  return "sample";
}

export async function generateMusic(args: {
  mode: EventMode;
  dayLoad: number;
  styleHint?: string | null;
  lyrics?: string | null;
  feeling?: Feeling | null;
}): Promise<MusicResult> {
  const { mode, dayLoad, styleHint, lyrics, feeling } = args;
  // Day load sets the base recipe; the user's check-in then calibrates it.
  const acoustics = calibrateAcoustics(acousticsFor(mode, dayLoad), mode, feeling);
  const prompt = buildMusicPrompt(mode, acoustics, styleHint);

  // 1) Suno — full songs with sung lyrics (best fit).
  if (process.env.SUNO_API_KEY?.trim()) {
    const r = await sunoGenerate({ mode, styleHint, lyrics, prompt });
    if (r.source === "suno") {
      return { provider: "suno", kind: "audio", trackUrl: r.url, title: r.title, acoustics };
    }
  }

  // 2) ElevenLabs Music — full songs with vocals.
  if (elevenLabsConfigured()) {
    const r = await generateMusicElevenLabs({ prompt, lyrics, mode });
    if (r) {
      return {
        provider: "elevenlabs",
        kind: "audio",
        trackUrl: r.url,
        title: mode === "prime" ? "Prime (ElevenLabs)" : "Wind-down (ElevenLabs)",
        acoustics,
      };
    }
  }

  // 3) Replicate MusicGen — instrumental (lyrics shown on-screen for Prime).
  if (replicateConfigured()) {
    const r = await generateMusicReplicate(prompt);
    if (r) {
      return {
        provider: "replicate",
        kind: "audio",
        trackUrl: r.url,
        title: mode === "prime" ? "Prime (MusicGen)" : "Wind-down (MusicGen)",
        acoustics,
      };
    }
  }

  // 4) Spotify — select a real track matching the mood (no custom lyrics).
  if (spotifyConfigured()) {
    const pick = await pickTrack(mode, styleHint);
    if (pick) {
      return {
        provider: "spotify",
        kind: "spotify",
        trackUrl: pick.trackUrl,
        title: `${pick.name} — ${pick.artist}`,
        acoustics,
      };
    }
  }

  // 5) Pre-loaded sample so the demo never breaks.
  const fb = fallbackTrack(mode);
  return {
    provider: "sample",
    kind: "audio",
    trackUrl: fb.url,
    title: fb.title,
    acoustics,
    note: "Using a sample track",
  };
}
