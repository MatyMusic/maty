// src/app/club/nearby/page.tsx
"use client";
import React, { useEffect, useState } from "react";

type NearbyItem = {
  userId: string;
  distMeters: number;
  displayName?: string | null;
  avatarUrl?: string | null;
  online: boolean;
  device?: string | null;
  city?: string | null;
  country?: string | null;
};

export default function NearbyPage() {
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [km, setKm] = useState(20);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/analytics/ping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ t: "pageview", p: "/club/nearby" }),
    }).catch(() => {});
  }, []);

  async function getNearby() {
    setLoading(true);
    setErr(null);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 10_000,
        }),
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      const r = await fetch(`/api/club/nearby?lat=${lat}&lng=${lng}&km=${km}`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "nearby_error");
      setItems(j.items || []);
    } catch (e: any) {
      setErr(e?.message || "שגיאה בשליפת נתונים או בהרשאת מיקום");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6" dir="rtl">
      <header className="mb-3">
        <h1 className="text-2xl font-extrabold">מי בסביבה</h1>
        <p className="opacity-70 text-sm">
          רשימת משתמשים פעילים באזורך (בהסכמתם)
        </p>
      </header>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm opacity-70">טווח (ק״מ):</span>
        <input
          type="number"
          value={km}
          onChange={(e) => setKm(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-lg border bg-transparent px-2 py-1 text-sm"
        />
        <button
          onClick={getNearby}
          disabled={loading}
          className="ms-auto rounded-xl border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
        >
          {loading ? "טוען…" : "בדיקה"}
        </button>
      </div>

      {err && (
        <div className="mb-3 rounded-xl border border-rose-300/40 bg-rose-100/80 dark:bg-rose-500/10 p-2 text-rose-800 dark:text-rose-300">
          {err}
        </div>
      )}

      <ul className="grid gap-3">
        {items.map((u) => (
          <li
            key={u.userId}
            className="flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 p-3 bg-white/70 dark:bg-neutral-900/70"
          >
            <img
              src={u.avatarUrl || "/assets/images/avatar-fun.png"}
              alt=""
              className="size-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <div className="truncate font-bold">
                {u.displayName || "משתמש/ת"}
              </div>
              <div className="truncate text-xs opacity-70">
                {[u.city, u.country].filter(Boolean).join(", ") || "—"}
              </div>
            </div>
            <div className="ms-auto text-xs">
              {(u.distMeters / 1000).toFixed(1)} ק״מ ·{" "}
              {u.online
                ? u.device === "mobile"
                  ? "מחובר/ת (נייד)"
                  : "מחובר/ת"
                : "לא מקוון/ת"}
            </div>
          </li>
        ))}
      </ul>

      {!items.length && !loading && (
        <div className="mt-6 text-center text-sm opacity-60">
          עדיין אין תוצאות. לחץ/י “בדיקה” לאחר מתן הרשאת מיקום.
        </div>
      )}
    </main>
  );
}
