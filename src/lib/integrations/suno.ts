import type { EventMode } from "../types";
import { modePolarity, modeHasLyrics, modeLabel } from "../modes";

/**
 * Suno music generation.
 *
 * REAL MUSIC GENERATION PLUGS IN HERE.
 * We POST a generation request to the Suno API and poll until the audio URL is
 * ready. The exact endpoint/shape varies by Suno provider, so the base URL is
 * configurable via SUNO_API_BASE. On ANY failure (missing key, timeout, error)
 * we fall back to a pre-loaded sample track so the demo never breaks.
 */

const SUNO_API_BASE =
  process.env.SUNO_API_BASE ?? "https://api.sunoapi.org";

export type SunoResult = {
  url: string;
  lyrics: string | null;
  title: string;
  source: "suno" | "fallback";
  note?: string;
};

export type GenerateArgs = {
  mode: EventMode;
  styleHint?: string | null; // music taste, used only as a STYLE hint
  // Prime-only: affirmation-style lyrics derived from meeting context.
  lyrics?: string | null;
  // Pre-built acoustic style prompt (from the acoustics engine). When provided
  // it overrides the default mood prompt.
  prompt?: string | null;
  // Used to build a descriptive style prompt.
  contextWhat?: string | null;
  company?: string | null;
};

export function fallbackTrack(mode: EventMode): SunoResult {
  return {
    url:
      modePolarity(mode) === "lift"
        ? "/audio/prime-sample.wav"
        : "/audio/winddown-sample.wav",
    lyrics: null,
    title: `${modeLabel(mode)} (sample)`,
    source: "fallback",
  };
}

/** Build a style prompt that always respects the mode's mood. */
export function buildStylePrompt(args: GenerateArgs): string {
  const taste = (args.styleHint ?? "").trim();
  if (modePolarity(args.mode) === "lift") {
    const base =
      "confident, uplifting, higher-energy track, driving beat, motivational";
    return taste
      ? `${base}; inspired by the genres/influences: ${taste} (use as loose influence only, prefer genres over copying specific artists)`
      : base;
  }
  const base =
    "calm, low-energy, soothing instrumental, ambient pads, gentle, no lyrics, relaxing";
  return taste
    ? `${base}; inspired by the genres/influences: ${taste} (loose influence only)`
    : base;
}

const SUNO_KEY = () => process.env.SUNO_API_KEY?.trim();

async function pollForAudio(
  taskId: string,
  key: string,
  timeoutMs = 90_000,
): Promise<{ url: string; lyrics: string | null; title: string } | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const res = await fetch(
        `${SUNO_API_BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
        { headers: { Authorization: `Bearer ${key}` } },
      );
      if (!res.ok) continue;
      const json = await res.json();
      const items =
        json?.data?.response?.sunoData ??
        json?.data?.data ??
        json?.data ??
        [];
      const list = Array.isArray(items) ? items : [items];
      const ready = list.find(
        (i: { audioUrl?: string; audio_url?: string }) =>
          i?.audioUrl || i?.audio_url,
      );
      if (ready) {
        return {
          url: ready.audioUrl ?? ready.audio_url,
          lyrics: ready.prompt ?? ready.lyric ?? null,
          title: ready.title ?? "Sounday track",
        };
      }
    } catch {
      // keep polling
    }
  }
  return null;
}

export async function generateTrack(args: GenerateArgs): Promise<SunoResult> {
  const key = SUNO_KEY();
  if (!key) {
    return { ...fallbackTrack(args.mode), note: "SUNO_API_KEY not set" };
  }

  const style = args.prompt?.trim() || buildStylePrompt(args);
  const instrumental = !modeHasLyrics(args.mode);

  try {
    const res = await fetch(`${SUNO_API_BASE}/api/v1/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        customMode: true,
        instrumental,
        model: "V4",
        style,
        title: modeLabel(args.mode),
        prompt: instrumental ? "" : (args.lyrics ?? ""),
        callBackUrl: process.env.SUNO_CALLBACK_URL ?? "https://example.com/cb",
      }),
    });

    if (!res.ok) {
      return { ...fallbackTrack(args.mode), note: `Suno HTTP ${res.status}` };
    }
    const json = await res.json();
    const taskId = json?.data?.taskId ?? json?.data?.task_id ?? json?.taskId;
    if (!taskId) {
      return { ...fallbackTrack(args.mode), note: "No taskId from Suno" };
    }

    const ready = await pollForAudio(taskId, key);
    if (!ready) {
      return { ...fallbackTrack(args.mode), note: "Suno timed out" };
    }
    return {
      url: ready.url,
      lyrics: instrumental ? null : (ready.lyrics ?? args.lyrics ?? null),
      title: ready.title,
      source: "suno",
    };
  } catch (e) {
    return {
      ...fallbackTrack(args.mode),
      note: `Suno error: ${(e as Error).message}`,
    };
  }
}
