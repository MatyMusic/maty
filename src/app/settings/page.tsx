// src/app/settings/page.tsx (דוגמית לוגיקה בלבד)
"use client";
import * as React from "react";

export default function Settings() {
  const [share, setShare] = React.useState(false);
  const [count, setCount] = React.useState(3);
  const [badge, setBadge] = React.useState(true);

  async function save() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shareMusicToDate: share,
        topTracksPublicCount: count,
        showMusicBadge: badge,
      }),
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">הגדרות</h1>
      <div className="rounded-2xl border p-4 grid gap-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={share}
            onChange={(e) => setShare(e.target.checked)}
          />
          הצג "וייב מוזיקלי" בפרופיל דייטינג
        </label>
        <label className="flex items-center gap-3">
          כמה שירים להציג:
          <input
            type="number"
            min={0}
            max={5}
            value={count}
            onChange={(e) => setCount(Number(e.target.value || 0))}
            className="h-9 w-16 border rounded px-2"
          />
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={badge}
            onChange={(e) => setBadge(e.target.checked)}
          />
          הצג באדג' מוזיקלי קטן
        </label>

        <div>
          <button
            onClick={save}
            className="h-10 px-4 rounded-full bg-neutral-900 text-white"
          >
            שמור
          </button>
        </div>
      </div>
    </main>
  );
}
