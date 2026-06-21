import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Where runtime-generated audio (e.g. ElevenLabs) is persisted.
 *
 * It lives under `public/audio/generated`, but is served through the
 * `/api/audio/[file]` route rather than Next's static handler: in production
 * (`next start`) Next only serves `public/` files that existed at build time,
 * so files written here at runtime 404 if linked as `/audio/generated/...`.
 */
export const GENERATED_AUDIO_DIR = path.join(
  process.cwd(),
  "public",
  "audio",
  "generated",
);

/** Save audio bytes and return the public URL that streams them. */
export async function saveGeneratedAudio(
  file: string,
  bytes: Buffer,
): Promise<string> {
  await mkdir(GENERATED_AUDIO_DIR, { recursive: true });
  await writeFile(path.join(GENERATED_AUDIO_DIR, file), bytes);
  return `/api/audio/${file}`;
}
