export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDayLong(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function fmtDayShort(d: Date): string {
  return d.toLocaleDateString([], { weekday: "short" });
}

export function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

export function loadLabel(score: number): { label: string; tone: string } {
  if (score >= 75) return { label: "Heavy", tone: "text-rose-500" };
  if (score >= 55) return { label: "Busy", tone: "text-amber-500" };
  if (score >= 30) return { label: "Steady", tone: "text-sea-600" };
  return { label: "Light", tone: "text-teal-500" };
}

export function loadColor(score: number): string {
  if (score >= 75) return "#f43f5e";
  if (score >= 55) return "#f59e0b";
  if (score >= 30) return "#2f87a6";
  return "#22a7a0";
}

export const CADENCE_OPTIONS: {
  value: "none" | "once" | "standard" | "full";
  label: string;
  hint: string;
}[] = [
  { value: "none", label: "No reminders", hint: "Routine event" },
  { value: "once", label: "Just once", hint: "15 min before" },
  { value: "standard", label: "Standard", hint: "Night before + 15 min before" },
  {
    value: "full",
    label: "Full prep",
    hint: "Night before + morning of + 15 min before",
  },
];
