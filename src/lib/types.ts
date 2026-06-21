export type Attendee = { name: string; email: string };

export type EventMode = "winddown" | "prime";
export type Cadence = "none" | "once" | "standard" | "full";

export type NotifPrefs = {
  sms: boolean;
  beforeMeeting: boolean;
  nightBefore: boolean;
  morningOf: boolean;
};

export type EventInput = {
  title: string;
  startDateTime: Date;
  durationMinutes: number;
  attendees: Attendee[];
  company?: string | null;
  contextWho?: string | null;
  contextWhat?: string | null;
  contextPurpose?: string | null;
};

export type Mood = {
  // 0..1
  energy: number;
  valence: number;
  label: string;
};

/** Pre/post check-in: how ready, calm and confident the user feels (each 1-3). */
export type Feeling = {
  ready: number;
  calm: number;
  confident: number;
};
