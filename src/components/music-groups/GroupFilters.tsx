// src/components/music-groups/GroupFilters.tsx
"use client";

import * as React from "react";

const DAWS = ["Ableton", "FL Studio", "Logic", "Pro Tools", "Cubase"];
const PURPOSES = ["Jam", "Practice", "Recording", "Learning", "Gig"];
const SKILLS = ["Beginner", "Intermediate", "Advanced"];

export default function GroupFilters({
  value,
  onChange,
  onLocate,
}: {
  value: {
    q: string;
    city: string;
    daws: string[];
    purposes: string[];
    skills: string[];
    radiusKm: number;
    lng?: number;
    lat?: number;
  };
  onChange: (v: any) => void;
  onLocate: () => void;
}) {
  function toggle(listKey: "daws" | "purposes" | "skills", v: string) {
    const arr = value[listKey] || [];
    const next = arr.includes(v)
      ? arr.filter((x: string) => x !== v)
      : [...arr, v];
    onChange({ ...value, [listKey]: next });
  }

  return (
    <section className="rounded-2xl border p-3 bg-white/70 dark:bg-white/10">
      <div className="grid gap-2 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs opacity-70">חיפוש</span>
          <input
            className="mm-input input-rtl"
            placeholder="שם/תיאור…"
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs opacity-70">עיר</span>
          <input
            className="mm-input input-rtl"
            placeholder="לדוגמה: תל אביב"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-[1fr_auto] items-end gap-2">
          <label className="grid gap-1">
            <span className="text-xs opacity-70">רדיוס (ק״מ)</span>
            <input
              type="number"
              min={0}
              step={0.5}
              className="mm-input"
              value={value.radiusKm || 0}
              onChange={(e) =>
                onChange({ ...value, radiusKm: Number(e.target.value || 0) })
              }
            />
          </label>
          <button
            type="button"
            className="mm-btn mm-pressable"
            onClick={onLocate}
          >
            מיקומי
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <fieldset className="rounded-xl border p-2">
          <legend className="text-xs opacity-70 px-1">DAW</legend>
          <div className="flex flex-wrap gap-1">
            {DAWS.map((d) => (
              <label
                key={d}
                className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={value.daws.includes(d)}
                  onChange={() => toggle("daws", d)}
                />
                {d}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-xl border p-2">
          <legend className="text-xs opacity-70 px-1">מטרות</legend>
          <div className="flex flex-wrap gap-1">
            {PURPOSES.map((p) => (
              <label
                key={p}
                className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={value.purposes.includes(p)}
                  onChange={() => toggle("purposes", p)}
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-xl border p-2">
          <legend className="text-xs opacity-70 px-1">רמות</legend>
          <div className="flex flex-wrap gap-1">
            {SKILLS.map((s) => (
              <label
                key={s}
                className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={value.skills.includes(s)}
                  onChange={() => toggle("skills", s)}
                />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
