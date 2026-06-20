/**
 * Twilio SMS.
 *
 * Sends an SMS to the user's phone. If credentials are missing we "simulate"
 * the send (so demos and local dev work without real SMS being sent).
 */
import twilio from "twilio";

export type SmsResult = {
  ok: boolean;
  simulated: boolean;
  sid?: string;
  error?: string;
};

function creds() {
  return {
    sid: process.env.TWILIO_ACCOUNT_SID?.trim(),
    token: process.env.TWILIO_AUTH_TOKEN?.trim(),
    from: process.env.TWILIO_FROM_NUMBER?.trim(),
  };
}

export function twilioConfigured(): boolean {
  const c = creds();
  return Boolean(c.sid && c.token && c.from);
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const c = creds();
  if (!c.sid || !c.token || !c.from) {
    return { ok: true, simulated: true };
  }
  try {
    const client = twilio(c.sid, c.token);
    const msg = await client.messages.create({ to, from: c.from, body });
    return { ok: true, simulated: false, sid: msg.sid };
  } catch (e) {
    return { ok: false, simulated: false, error: (e as Error).message };
  }
}

export function buildReminderSms(opts: {
  whenLabel: string;
  title: string;
  company?: string | null;
  link: string;
}): string {
  const target = opts.company ? `${opts.company}` : opts.title;
  return `${opts.whenLabel} to your ${opts.title}${
    opts.company ? ` with ${target}` : ""
  } — here's your prep track ${opts.link}`;
}
