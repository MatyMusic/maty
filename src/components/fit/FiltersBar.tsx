// src/components/fit/FiltersBar.tsx
"use client";
import * as React from "react";

export const CATS = [
  { k: "", v: "הכול" },
  { k: "chest", v: "חזה" },
  { k: "back", v: "גב" },
  { k: "legs", v: "רגליים" },
  { k: "shoulders", v: "כתפיים" },
  { k: "arms", v: "ידיים" },
  { k: "abs", v: "בטן" },
  { k: "full_body", v: "פול־באדי" },
  { k: "cardio", v: "אירובי" },
  { k: "mobility", v: "מוביליטי" },
  { k: "other", v: "אחר" },
] as const;

export const DIFFS = [
  { k: "", v: "כל רמה" },
  { k: "beginner", v: "מתחילים" },
  { k: "intermediate", v: "ביניים" },
  { k: "advanced", v: "מתקדמים" },
] as const;

type Props = {
  q: string;
  setQ: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  muscle: string;
  setMuscle: (v: string) => void;
  equipment: string;
  setEquipment: (v: string) => void;
  difficulty: string;
  setDifficulty: (v: string) => void;
  onReset?: () => void;
};

export default function FiltersBar(props: Props) {
  const {
    q,
    setQ,
    category,
    setCategory,
    muscle,
    setMuscle,
    equipment,
    setEquipment,
    difficulty,
    setDifficulty,
    onReset,
  } = props;
  return (
    <section
      className="rounded-2xl border p-4 mb-4 bg-white/60 dark:bg-black/30 backdrop-blur"
      dir="rtl"
    >
      <div className="grid gap-2 md:grid-cols-12">
        <div className="md:col-span-4">
          <label className="text-xs opacity-70">חיפוש</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="שם תרגיל / מילת מפתח"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs opacity-70">קטגוריה</label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATS.map((c) => (
              <option key={c.k} value={c.k}>
                {c.v}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs opacity-70">שריר (EN/HE)</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="לדוגמה: chest / ישבן"
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs opacity-70">ציוד</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="לדוגמה: dumbbell / דאמבלים"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs opacity-70">רמה</label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {DIFFS.map((d) => (
              <option key={d.k} value={d.k}>
                {d.v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          className="rounded-xl border px-3 py-1.5 text-sm"
          onClick={onReset}
        >
          איפוס
        </button>
      </div>
    </section>
  );
}
