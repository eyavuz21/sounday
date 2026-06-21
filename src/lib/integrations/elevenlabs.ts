import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EventMode } from "../types";
import { modeHasLyrics } from "../modes";

/**
 * ElevenLabs Music — generates full songs (with vocals/lyrics) from a prompt.
 *
 * The endpoint streams raw audio bytes, so we persist the result under
 * /public/audio/generated and return its public path. Any failure returns null
 * so the caller can fall back. Docs: https://elevenlabs.io/docs (Music API).
 */

const ELEVEN_API = "https://api.elevenlabs.io/v1/music";

export function elevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

export async function generateMusicElevenLabs(args: {
  prompt: string;
  lyrics?: string | null;
  mode: EventMode;
  lengthMs?: number;
}): Promise<{ url: string } | null> {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) return null;

  // Modes with lyrics ask the model to sing the affirmations; the rest are
  // instrumental. Lyrics are folded into the prompt the model composes from.
  const prompt =
    modeHasLyrics(args.mode) && args.lyrics
      ? `${args.prompt}\n\nVocals singing these affirmation lyrics:\n${args.lyrics}`
      : args.prompt;

  try {
    const res = await fetch(ELEVEN_API, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        music_length_ms: args.lengthMs ?? 30000,
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return null;

    const dir = path.join(process.cwd(), "public", "audio", "generated");
    await mkdir(dir, { recursive: true });
    const file = `eleven-${Date.now()}.mp3`;
    await writeFile(path.join(dir, file), buf);
    return { url: `/audio/generated/${file}` };
  } catch {
    return null;
  }
}
