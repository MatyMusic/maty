"use client";
import * as React from "react";
import { Hash } from "lucide-react";
import { GENRES } from "../lib/constants";

export function GenreSelect({
  value,
  onChange,
  onAdoptSuggestions,
  suggestions,
  addTag,
}: {
  value: string;
  onChange: (v: string) => void;
  onAdoptSuggestions: () => void;
  suggestions: string[];
  addTag: (t: string) => void;
}) {
  return (
    <div>
      <label className="form-label">ז׳אנר</label>
      <select
        className="mm-select w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {GENRES.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="mm-chip"
          onClick={onAdoptSuggestions}
          title="הוסף תגיות מומלצות לפי הז׳אנר"
        >
          <Hash className="h-4 w-4 ml-1" />
          הוסף תגיות מומלצות
        </button>
        {/* הצצה מהירה לסוג תגיות */}
        <div className="flex items-center gap-2 text-[11px] opacity-70">
          הצעות:
          <div className="flex flex-wrap gap-1">
            {suggestions.map((sg) => (
              <button
                type="button"
                key={sg}
                className="mm-chip"
                onClick={() => addTag(sg)}
                title={`הוסף תג "${sg}"`}
              >
                #{sg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
