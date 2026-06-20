/**
 * Replicate — MusicGen (Meta) instrumental generation.
 *
 * MusicGen produces instrumental audio from a text prompt (no sung vocals), so
 * for Prime mode the affirmation lyrics are shown on-screen over the track.
 * Returns a hosted audio URL. Any failure returns null so the caller can fall
 * back. Docs: https://replicate.com/meta/musicgen/api
 */

const REPLICATE_API = "https://api.replicate.com/v1";

export function replicateConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN?.trim());
}

type Prediction = {
  status?: string;
  output?: string | string[];
  error?: string;
};

export async function generateMusicReplicate(
  prompt: string,
  durationSec = 20,
): Promise<{ url: string } | null> {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) return null;

  try {
    const res = await fetch(
      `${REPLICATE_API}/models/meta/musicgen/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: {
            prompt,
            duration: durationSec,
            output_format: "mp3",
            normalization_strategy: "peak",
          },
        }),
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Prediction;
    const out = Array.isArray(json.output) ? json.output[0] : json.output;
    return out ? { url: out } : null;
  } catch {
    return null;
  }
}
