"use client";

import { useState } from "react";
import DictateButton from "@/components/DictateButton";

const MAX = 5;

function splitSpoken(text: string): string[] {
  return text
    .split(/,| and |&|;/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function TasteEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(items: string[]) {
    const next = [...value];
    for (const it of items) {
      const v = it.trim();
      if (v && !next.some((x) => x.toLowerCase() === v.toLowerCase()) && next.length < MAX) {
        next.push(v);
      }
    }
    onChange(next);
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function commitDraft() {
    if (!draft.trim()) return;
    add(splitSpoken(draft));
    setDraft("");
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {value.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="badge bg-sea-100 py-1.5 pl-3 pr-1.5 text-sea-700"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${t}`}
              className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-sea-200 text-sea-700"
            >
              ×
            </button>
          </span>
        ))}
        {value.length === 0 && (
          <span className="text-sm text-mist">
            No genres yet — optional, but it personalises your tracks.
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="input"
          placeholder="e.g. lo-fi, ambient, house"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
          disabled={value.length >= MAX}
        />
        <button
          type="button"
          onClick={commitDraft}
          className="btn-ghost min-h-[44px] px-4 text-sm"
          disabled={value.length >= MAX}
        >
          Add
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <DictateButton
          label="Add by voice"
          onText={(text) => add(splitSpoken(text))}
        />
        <span className="text-xs text-mist">{value.length}/{MAX}</span>
      </div>
      <p className="mt-2 text-xs text-mist">
        We use these as a loose style hint — Wind-down stays calm, Prime stays
        confident. Prefer genres over artists.
      </p>
    </div>
  );
}
