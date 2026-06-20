import type { EventMode } from "../types";

/**
 * Spotify music selection (Client Credentials flow).
 *
 * The user provided Spotify (not Suno), so instead of *generating* a track we
 * *select* a real one whose mood matches the event's mode, biased by the user's
 * music taste. Playback uses Spotify's embed player (no Premium / OAuth needed).
 *
 * Note: Spotify deprecated the Recommendations & Audio-Features endpoints for
 * new apps, so we drive mood via curated search queries instead.
 */

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

const MOOD_TERMS: Record<EventMode, string[]> = {
  winddown: ["calm ambient", "peaceful instrumental", "relaxing chill", "soft piano calm"],
  prime: ["hype motivation", "energetic pump up", "confident anthem", "high energy workout"],
};

export type SpotifyPick = {
  trackUrl: string; // https://open.spotify.com/track/{id}
  embedUrl: string; // https://open.spotify.com/embed/track/{id}
  name: string;
  artist: string;
  source: "spotify";
  query: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

export function spotifyConfigured(): boolean {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID?.trim() &&
      process.env.SPOTIFY_CLIENT_SECRET?.trim(),
  );
}

async function getToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID?.trim();
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!id || !secret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.value;
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[spotify] token HTTP", res.status, await res.text());
    return null;
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cachedToken.value;
}

function buildQuery(mode: EventMode, styleHint?: string | null): string {
  const moods = MOOD_TERMS[mode];
  const mood = moods[Math.floor(Math.random() * moods.length)];
  // Use only the first taste term to avoid over-narrowing the search.
  const taste = (styleHint ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  return taste ? `${mood} ${taste}` : mood;
}

type SpotifyTrack = {
  id: string;
  name: string;
  external_urls: { spotify: string };
  artists: { name: string }[];
};

/** Extract a Spotify playlist id from a URL, URI, or bare id. */
export function parsePlaylistId(ref?: string | null): string | null {
  if (!ref) return null;
  const s = ref.trim();
  if (!s) return null;
  // spotify:playlist:ID
  const uri = s.match(/playlist[:/]([A-Za-z0-9]{22})/);
  if (uri) return uri[1];
  // bare 22-char base62 id
  if (/^[A-Za-z0-9]{22}$/.test(s)) return s;
  return null;
}

type PlaylistItem = { track: { artists?: { name: string }[] } | null };

/**
 * Read a user playlist and return its most frequent artist names (loose style
 * influences). Returns [] on any failure — note: in Spotify "development mode"
 * the playlist *tracks* endpoint is restricted (403), so this degrades to the
 * user's typed taste. It will start working automatically once the Spotify app
 * is granted extended/production quota.
 */
export async function artistsFromPlaylist(
  ref?: string | null,
  max = 5,
): Promise<string[]> {
  const id = parsePlaylistId(ref);
  if (!id) return [];
  const token = await getToken();
  if (!token) return [];
  try {
    const res = await fetch(
      `${API}/playlists/${id}/tracks?limit=50&fields=${encodeURIComponent(
        "items(track(artists(name)))",
      )}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!res.ok) {
      console.warn("[spotify] playlist tracks HTTP", res.status);
      return [];
    }
    const json = (await res.json()) as { items?: PlaylistItem[] };
    const counts = new Map<string, number>();
    for (const it of json.items ?? []) {
      for (const a of it.track?.artists ?? []) {
        if (!a?.name) continue;
        counts.set(a.name, (counts.get(a.name) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([name]) => name);
  } catch {
    return [];
  }
}

export async function pickTrack(
  mode: EventMode,
  styleHint?: string | null,
): Promise<SpotifyPick | null> {
  const token = await getToken();
  if (!token) return null;
  const query = buildQuery(mode, styleHint);

  try {
    // Spotify dev-mode apps cap the search `limit` at 10.
    const res = await fetch(
      `${API}/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!res.ok) {
      console.error("[spotify] search HTTP", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as {
      tracks?: { items?: SpotifyTrack[] };
    };
    const items = json.tracks?.items ?? [];
    if (items.length === 0) return null;
    // Pick from the top results for variety.
    const pool = items.slice(0, Math.min(items.length, 12));
    const t = pool[Math.floor(Math.random() * pool.length)];
    return {
      trackUrl: t.external_urls.spotify,
      embedUrl: `https://open.spotify.com/embed/track/${t.id}`,
      name: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      source: "spotify",
      query,
    };
  } catch {
    return null;
  }
}
