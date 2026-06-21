import type { Feeling } from "./types";

export type FeelingKey = keyof Feeling;

/** The three check-in dimensions, each as a row of word chips (index 0 = 1). */
export const FEELING_DIMENSIONS: {
  key: FeelingKey;
  label: string;
  chips: [string, string, string];
}[] = [
  { key: "ready", label: "Ready", chips: ["Not yet", "Getting there", "Ready"] },
  { key: "calm", label: "Calm", chips: ["On edge", "Okay", "Calm"] },
  {
    key: "confident",
    label: "Confident",
    chips: ["Unsure", "Steady", "Confident"],
  },
];

/** Word label for a single dimension value (1-3). */
export function chipLabel(key: FeelingKey, value: number): string {
  const dim = FEELING_DIMENSIONS.find((d) => d.key === key);
  return dim?.chips[Math.min(2, Math.max(0, value - 1))] ?? "";
}

/** Average of the three dimensions (1-3). */
export function feelingAverage(f: Feeling): number {
  return (f.ready + f.calm + f.confident) / 3;
}

/** A short overall word for the whole reading. */
export function feelingSummary(f: Feeling): string {
  const avg = feelingAverage(f);
  if (avg >= 2.5) return "ready";
  if (avg >= 1.84) return "steady";
  return "tense";
}

/** Human-readable before→after shift, e.g. "Tense → Ready (+3)". */
export function feelingShift(
  before: Feeling,
  after: Feeling,
): { from: string; to: string; delta: number } {
  const sum = (f: Feeling) => f.ready + f.calm + f.confident;
  return {
    from: feelingSummary(before),
    to: feelingSummary(after),
    delta: sum(after) - sum(before),
  };
}
