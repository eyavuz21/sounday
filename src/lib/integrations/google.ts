/**
 * Google Calendar integration (OAuth 2.0, read-only).
 *
 * Lets a user connect their Google account so their real schedule is pulled in
 * automatically — no .csv upload. We request only the `calendar.readonly` scope
 * and store the resulting tokens on the User. Synced events run through the same
 * stress-scoring / high-stakes engine as the seed data.
 *
 * While the Google Cloud app is in "testing" status, only test users added in
 * the console can connect — fine for the hackathon demo.
 */

import type { Attendee } from "../types";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

/**
 * Read an OAuth credential from the environment, stripping ALL whitespace.
 * Client IDs/secrets never contain whitespace, but values pasted into a host's
 * env UI often pick up stray newlines from line-wrapped copy/paste — which makes
 * Google reject the request with `invalid_client`. Removing internal whitespace
 * (not just trimming the ends) makes the integration resilient to that.
 */
function cred(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET"): string {
  return (process.env[name] ?? "").replace(/\s+/g, "");
}

export function googleConfigured(): boolean {
  return Boolean(cred("GOOGLE_CLIENT_ID") && cred("GOOGLE_CLIENT_SECRET"));
}

/** Build the origin (scheme://host) from a request, honouring proxy headers. */
export function originFromRequest(req: Request): string {
  const h = req.headers;
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** The OAuth redirect URI for this deployment (overridable via env). */
export function redirectUri(req: Request): string {
  const override = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (override) return override;
  return `${originFromRequest(req)}/api/google/callback`;
}

/** URL the user is sent to in order to grant Calendar read access. */
export function authUrl(redirect: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: cred("GOOGLE_CLIENT_ID"),
    redirect_uri: redirect,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
  });
  if (state) params.set("state", state);
  return `${AUTH_URL}?${params.toString()}`;
}

export type GoogleTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

/** Exchange an authorization code for tokens. */
export async function exchangeCode(
  code: string,
  redirect: string,
): Promise<GoogleTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cred("GOOGLE_CLIENT_ID"),
      client_secret: cred("GOOGLE_CLIENT_SECRET"),
      redirect_uri: redirect,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const json = (await res.json()) as TokenResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(
      `Google token exchange failed: ${json.error ?? res.status} ${
        json.error_description ?? ""
      }`.trim(),
    );
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1000),
  };
}

/** Refresh an access token using a stored refresh token. */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<GoogleTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: cred("GOOGLE_CLIENT_ID"),
      client_secret: cred("GOOGLE_CLIENT_SECRET"),
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const json = (await res.json()) as TokenResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(`Google token refresh failed: ${json.error ?? res.status}`);
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1000),
  };
}

/** Fetch the connected account's email (for display). */
export async function fetchUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { email?: string };
    return json.email ?? null;
  } catch {
    return null;
  }
}

export type NormalizedEvent = {
  externalId: string;
  title: string;
  startDateTime: Date;
  durationMinutes: number;
  attendees: Attendee[];
  company: string | null;
};

type GCalAttendee = {
  email?: string;
  displayName?: string;
  self?: boolean;
  responseStatus?: string;
};

type GCalEvent = {
  id?: string;
  summary?: string;
  status?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: GCalAttendee[];
  organizer?: { email?: string };
};

/** Turn a domain (acme-corp.com) into a display company name (Acme Corp). */
function companyFromDomain(domain: string): string {
  const base = domain.split(".").slice(0, -1).join(" ") || domain;
  return base
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const GENERIC_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);

/**
 * Fetch upcoming events (next `days` days) from the user's primary calendar and
 * normalize them. Expands recurring events into single instances.
 */
export async function fetchUpcomingEvents(
  accessToken: string,
  days = 14,
): Promise<NormalizedEvent[]> {
  const now = new Date();
  const timeMax = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });
  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`Google Calendar list failed: HTTP ${res.status}`);
  }
  const json = (await res.json()) as { items?: GCalEvent[] };
  const out: NormalizedEvent[] = [];

  for (const ev of json.items ?? []) {
    if (ev.status === "cancelled") continue;
    // Skip all-day events (no specific time to soundtrack).
    const startISO = ev.start?.dateTime;
    if (!ev.id || !startISO) continue;
    const start = new Date(startISO);
    const endISO = ev.end?.dateTime;
    const durationMinutes = endISO
      ? Math.max(
          5,
          Math.round((new Date(endISO).getTime() - start.getTime()) / 60_000),
        )
      : 30;

    const attendees: Attendee[] = (ev.attendees ?? [])
      .filter((a) => a.email && !a.self)
      .map((a) => ({ name: a.displayName ?? a.email!, email: a.email! }));

    // Infer a company from the first external (non-generic) attendee domain.
    let company: string | null = null;
    for (const a of attendees) {
      const domain = a.email.split("@")[1]?.toLowerCase();
      if (domain && !GENERIC_DOMAINS.has(domain)) {
        company = companyFromDomain(domain);
        break;
      }
    }

    out.push({
      externalId: ev.id,
      title: ev.summary?.trim() || "(untitled event)",
      startDateTime: start,
      durationMinutes,
      attendees,
      company,
    });
  }
  return out;
}
