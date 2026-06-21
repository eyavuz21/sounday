"use client";

import { FEELING_DIMENSIONS, type FeelingKey } from "@/lib/feeling";
import type { Feeling } from "@/lib/types";

export default function MoodCheck({
  value,
  onChange,
  accent = "sea",
}: {
  value: Feeling | null;
  onChange: (next: Feeling) => void;
  accent?: "sea" | "amber";
}) {
  // A partial reading is allowed in the UI; we only persist once all three are set.
  const current: Partial<Feeling> = value ?? {};

  function set(key: FeelingKey, level: number) {
    onChange({
      ready: key === "ready" ? level : (current.ready ?? 2),
      calm: key === "calm" ? level : (current.calm ?? 2),
      confident: key === "confident" ? level : (current.confident ?? 2),
    });
  }

  const activeBg =
    accent === "amber"
      ? "bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-soft"
      : "bg-gradient-to-br from-sea-500 to-teal-500 text-white shadow-soft";

  return (
    <div className="flex flex-col gap-3">
      {FEELING_DIMENSIONS.map((dim) => {
        const selected = current[dim.key];
        return (
          <div key={dim.key}>
            <span className="label mb-1.5">{dim.label}</span>
            <div className="grid grid-cols-3 gap-2">
              {dim.chips.map((chip, i) => {
                const level = i + 1;
                const isActive = selected === level;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => set(dim.key, level)}
                    className={`rounded-2xl px-2 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? activeBg
                        : "bg-white/70 text-ink ring-1 ring-sea-200 hover:ring-sea-300"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
