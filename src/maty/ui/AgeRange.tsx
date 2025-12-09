"use client";

import * as React from "react";

type Props = {
  min?: number;
  max?: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange: (v: { min: number; max: number }) => void;
};

export default function AgeRange({
  min = 18,
  max = 99,
  step = 1,
  valueMin,
  valueMax,
  onChange,
}: Props) {
  const clamp = (n: number) => Math.min(Math.max(n, min), max);
  const low = clamp(Math.min(valueMin, valueMax));
  const high = clamp(Math.max(valueMin, valueMax));

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  // אין כאן {...props} שמכיל key → אין אזהרת React
  return (
    <div dir="rtl" className="w-full">
      {/* פס */}
      <div className="relative h-9">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full bg-black/10 dark:bg-white/10" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
          style={{ left: `${pct(low)}%`, right: `${100 - pct(high)}%` }}
        />
        {/* טאמבים (2 input[type=range] חופפים) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) =>
            onChange({ min: Math.min(+e.target.value, high - step), max: high })
          }
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-auto"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) =>
            onChange({ min: low, max: Math.max(+e.target.value, low + step) })
          }
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-auto"
        />

        {/* בועות מעל הטאמבים */}
        <span
          className="absolute -top-6 translate-x-1/2 text-[11px] rounded-md px-1.5 py-0.5 bg-white/90 dark:bg-neutral-900/90 border border-black/10 dark:border-white/10"
          style={{ right: `calc(${pct(low)}% )` }}
        >
          {low}
        </span>
        <span
          className="absolute -top-6 -translate-x-1/2 text-[11px] rounded-md px-1.5 py-0.5 bg-white/90 dark:bg-neutral-900/90 border border-black/10 dark:border-white/10"
          style={{ left: `calc(${pct(high)}% )` }}
        >
          {high}
        </span>
      </div>

      {/* שורת קלטים מספריים + תיאור */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs opacity-75">
            גיל מינ׳
            <input
              type="number"
              min={min}
              max={high - step}
              value={low}
              onChange={(e) =>
                onChange({
                  min: clamp(Math.min(+e.target.value || min, high - step)),
                  max: high,
                })
              }
              className="h-8 w-16 rounded-xl border px-2 bg-white/90 dark:bg-neutral-900/90"
            />
          </label>
          <span className="opacity-50">—</span>
          <label className="flex items-center gap-1 text-xs opacity-75">
            גיל מקס׳
            <input
              type="number"
              min={low + step}
              max={max}
              value={high}
              onChange={(e) =>
                onChange({
                  min: low,
                  max: clamp(
                    Math.max(+e.target.value || low + step, low + step)
                  ),
                })
              }
              className="h-8 w-16 rounded-xl border px-2 bg-white/90 dark:bg-neutral-900/90"
            />
          </label>
        </div>

        <div className="text-xs opacity-70">
          {high}-{low} · טווח גיל
        </div>
      </div>

      {/* סטיילינג לטאמבים של ה-range (webkit/moz) */}
      <style jsx>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 1px solid rgb(0 0 0 / 0.1);
          box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
          cursor: pointer;
          position: relative;
          z-index: 2;
        }
        input[type="range"]::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 1px solid rgb(0 0 0 / 0.1);
          box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
          cursor: pointer;
          position: relative;
          z-index: 2;
        }
      `}</style>
    </div>
  );
}
