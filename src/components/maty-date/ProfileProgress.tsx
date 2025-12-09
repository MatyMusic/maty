"use client";
import * as React from "react";

export default function ProfileProgress({
  percent,
  missing = [],
  minOK = 60,
}: {
  percent: number;
  missing?: string[];
  minOK?: number;
}) {
  const ok = percent >= minOK;

  return (
    <div
      dir="rtl"
      className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">
          התקדמות הפרופיל:{" "}
          <span className={ok ? "text-emerald-600" : "text-amber-600"}>
            {percent}%
          </span>
        </div>
        <div className="text-xs opacity-70">
          {ok ? "אפשר להמשיך 👌" : `צריך להגיע ל־${minOK}% לפחות`}
        </div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
          style={{ width: `${percent}%` }}
          aria-hidden
        />
      </div>

      {missing.length > 0 && (
        <div className="mt-3 text-sm">
          <div className="opacity-70 mb-1">חסר עדיין:</div>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <span
                key={m}
                className="px-2 py-1 rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 text-xs"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
