// src/components/fit/ProviderSwitch.tsx
"use client";
import * as React from "react";

const PROVIDERS = [
  { k: "wger", v: "WGER (חינם)" },
  { k: "exercisedb", v: "ExerciseDB (GIFs)" },
  { k: "ninjas", v: "API Ninjas (טקסט)" },
  { k: "hybrid", v: "Hybrid" },
] as const;

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function ProviderSwitch({ value, onChange }: Props) {
  React.useEffect(() => {
    const saved = localStorage.getItem("maty:fit:provider");
    if (saved && !value) onChange(saved);
    // eslint-disable-next-line
  }, []);

  const set = (v: string) => {
    try {
      localStorage.setItem("maty:fit:provider", v);
    } catch {}
    onChange(v);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs opacity-70">ספק נתונים</label>
      <select
        className="rounded-xl border px-3 py-1.5 text-sm"
        value={value}
        onChange={(e) => set(e.target.value)}
      >
        {PROVIDERS.map((p) => (
          <option key={p.k} value={p.k}>
            {p.v}
          </option>
        ))}
      </select>
    </div>
  );
}
