// src/components/nigunim/NiggunimList.tsx
"use client";

import { useMemo, useState } from "react";
import type { MiniTrack as Track } from "@/components/MiniPlayer";

export type Nigun = {
  id: string;
  title: string;
  artists: string[];
  source: "youtube" | "spotify" | "local" | string;
  url: string;         // ב-local: לינק אודיו ישיר; ביוטיוב/ספוטיפיי: קישור חיצוני
  cover?: string;
  duration?: number;
  tags?: string[];
};

function toTrack(n: Nigun): Track | undefined {
  if (n.source !== "local") return undefined; // רק מקומי ניתן לנגן ישירות
  return {
    id: n.id,
    title: n.title,
    artist: n.artists?.join(", ") || "Maty Music",
    src: n.url,
    cover: n.cover,
  };
}

const fmt = (s?: number) => {
  if (!s || !isFinite(s)) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function NiggunimList({ initial = [] as Nigun[] }: { initial?: Nigun[] }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    if (!q.trim()) return initial;
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return initial.filter(
      (n) => rx.test(n.title) || n.artists?.some((a) => rx.test(a))
    );
  }, [q, initial]);

  const playNow = (n: Nigun) => {
    const t = toTrack(n);
    if (!t) return window.open(n.url, "_blank"); // יוטיוב/ספוטיפיי — פתח בכרטיסייה
    dispatchEvent(new CustomEvent("mm:play", { detail: { track: t } }));
  };

  const addToQueue = (n: Nigun) => {
    const t = toTrack(n);
    if (!t) return alert("שיר חיצוני (YouTube/Spotify) — לא ניתן להוסיף לתור פנימי.");
    dispatchEvent(new CustomEvent("mm:queue:add", { detail: { track: t } }));
  };

  return (
    <div dir="rtl" className="mm-card p-4 md:p-5">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <h2 className="text-xl font-extrabold">ניגוני חב״ד</h2>
        <input
          className="mm-input max-w-md"
          placeholder="חיפוש ניגון / אמן…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <ul className="mt-4 divide-y divide-black/10 dark:divide-white/10">
        {list.map((n) => (
          <li key={n.id} className="py-3 flex items-center gap-3">
            {/* עטיפה */}
            <img
              src={n.cover || "/icon.svg"}
              alt=""
              className="h-12 w-12 rounded-lg object-cover border border-black/10 dark:border-white/10"
            />

            {/* פרטים */}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{n.title}</div>
              <div className="text-sm opacity-70 truncate">
                {n.artists?.join(", ")} · {n.source} · {fmt(n.duration)}
              </div>
            </div>

            {/* פעולות */}
            <div className="flex items-center gap-2">
              <button className="mm-btn" onClick={() => playNow(n)}>
                {n.source === "local" ? "נגן" : "פתח"}
              </button>
              <button
                className="mm-btn"
                onClick={() => addToQueue(n)}
                disabled={n.source !== "local"}
                title={n.source !== "local" ? "שיר חיצוני" : ""}
              >
                לתור +
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!list.length && (
        <div className="mt-6 text-center opacity-70">לא נמצאו תוצאות.</div>
      )}
    </div>
  );
}
