import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { GENERATED_AUDIO_DIR } from "@/lib/integrations/audio-store";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
};

/**
 * Streams a runtime-generated audio file from disk. Generated tracks are written
 * after build time, so Next's static handler won't serve them in production —
 * this route reads them directly instead.
 */
export async function GET(
  _req: Request,
  { params }: { params: { file: string } },
) {
  // Only allow a plain filename (no path traversal).
  const file = path.basename(params.file);
  if (file !== params.file) {
    return new NextResponse("Not found", { status: 404 });
  }
  const ext = path.extname(file).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const bytes = await readFile(path.join(GENERATED_AUDIO_DIR, file));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
