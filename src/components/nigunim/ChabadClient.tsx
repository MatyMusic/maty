// src/components/nigunim/ChabadClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Track = { id: string; title: string; artist: string; src: string; cover?: string };

export default function ChabadClient({ initialTracks }: { initialTracks: Track[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"title"|"artist">("title");

  const list = useMemo(() => {
    const rx = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
    const filtered = initialTracks.filter(t => (rx ? (rx.test(t.title) || rx.test(t.artist)) : true));
    return filtered.sort((a,b) => a[sort].localeCompare(b[sort], "he"));
  }, [q, sort, initialTracks]);

  const playAll = () => {
    if (!list.length) return;
    // נגן מהיר—מעדכן את הנגן הצף (ProPlayer) לנגן את כל הרשימה
    window.dispatchEvent(new CustomEvent("mm:play", { detail: { track: list[0], queue: list } }));
  };

  const addAllToQueue = () => {
    list.forEach(t => window.dispatchEvent(new CustomEvent("mm:queue:add", { detail: { track: t } })));
  };

  return (
    <section className="container-section section-padding" dir="rtl">
      <div className="mm-card p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">ניגוני חב״ד</h1>
            <p className="opacity-75 mt-1">מאגר ניגונים מסודר עם השמעה רציפה והוספה לתור.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary" onClick={playAll}>נגן הכול</button>
            <button className="btn" onClick={addAllToQueue}>הוסף הכול לתור</button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="input-base md:col-span-2 input-rtl"
            placeholder="חפש ניגון לפי שם/אומן…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input-base" value={sort} onChange={(e)=>setSort(e.target.value as any)}>
            <option value="title">מיון: שם</option>
            <option value="artist">מיון: אומן</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {list.map((t) => (
          <div key={t.id} className="mm-card p-4 flex items-center gap-3">
            <img
              src={t.cover || "/assets/images/avatar-chabad.png"}
              alt=""
              className="h-12 w-12 rounded-lg object-cover border border-black/10 dark:border-white/10"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{t.title}</div>
              <div className="truncate text-sm opacity-70">{t.artist}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary"
                onClick={() => window.dispatchEvent(new CustomEvent("mm:play", { detail: { track: t } }))}
              >
                נגן
              </button>
              <button
                className="btn"
                onClick={() => window.dispatchEvent(new CustomEvent("mm:queue:add", { detail: { track: t } }))}
              >
                לתור
              </button>
            </div>
          </div>
        ))}

        {!list.length && (
          <div className="mm-card p-6 text-center opacity-75">לא נמצאו תוצאות.</div>
        )}
      </div>
    </section>
  );
}
