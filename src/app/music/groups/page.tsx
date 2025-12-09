// src/app/music/groups/page.tsx
"use client";

import * as React from "react";
import CreateGroupForm from "@/components/music/CreateGroupForm";
import { useIsAdmin } from "@/hooks/useIsAdmin"; // אם קיים אצלך; אחרת אפשר להסתיר כפתור stop לפי תשובת השרת

type GroupDoc = {
  _id: string;
  title: string;
  desc?: string;
  status: "active" | "stopped" | "pending";
  center?: { type: "Point"; coordinates: [number, number] }; // [lng,lat]
  radiusKm?: number;
  createdAt?: string;
};

export default function MusicGroupsPage() {
  const admin = useIsAdmin?.() ?? null; // אם אין hook כזה, תוריד את זה
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);
  const [radiusKm, setRadiusKm] = React.useState(10);
  const [items, setItems] = React.useState<GroupDoc[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (lat != null && lng != null) {
        sp.set("lat", String(lat));
        sp.set("lng", String(lng));
        sp.set("radiusKm", String(radiusKm));
      }
      sp.set("limit", "24");
      const r = await fetch(`/api/music/groups?${sp.toString()}`, {
        cache: "no-store",
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setItems(j.items || []);
    } catch (e: any) {
      setErr(e?.message || "שגיאה בטעינה");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    // אופציונלי: למשוך מיקום אוטומטית
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(6)));
          setLng(Number(pos.coords.longitude.toFixed(6)));
        },
        () => {},
      );
    }
  }, []);

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, radiusKm]);

  async function stopGroup(id: string) {
    if (!confirm("לעצור את הקבוצה?")) return;
    try {
      const r = await fetch("/api/music/groups", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop", id }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      // רענון
      load();
      try {
        window.dispatchEvent(
          new CustomEvent("mm:toast", {
            detail: { type: "success", text: "הקבוצה נעצרה" },
          }),
        );
      } catch {}
    } catch (e: any) {
      alert(e?.message || "שגיאה בעצירה (נדרש אדמין)");
    }
  }

  return (
    <main dir="rtl" className="container-section section-padding space-y-4">
      <h1 className="text-2xl font-extrabold">קבוצות מוזיקה (JAM)</h1>

      <CreateGroupForm defaultRadiusKm={10} onCreated={() => load()} />

      <div className="mm-card p-3">
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-2">
            <span>רדיוס חיפוש (ק״מ)</span>
            <input
              className="mm-input w-24"
              type="number"
              min={0}
              step={0.5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
            />
          </label>
          <button className="mm-btn mm-pressable" onClick={load}>
            רענן
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      {loading && <div className="opacity-60">טוען…</div>}

      {!loading && !items.length && (
        <div className="mm-card p-6 text-center opacity-70">אין קבוצות</div>
      )}

      {!!items.length && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => (
            <li key={String(g._id)} className="card p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold truncate">{g.title}</div>
                <span className="rounded-full border px-2 py-0.5 text-xs">
                  {g.status}
                </span>
              </div>
              {g.desc && (
                <div className="mt-1 text-sm opacity-80">{g.desc}</div>
              )}
              <div className="mt-2 text-xs opacity-70">
                רדיוס: {g.radiusKm ?? 0} ק״מ
              </div>
              <div className="mt-3 flex items-center gap-2">
                {/* כפתור עצירה – יופיע רק לאדמין אם יש לך useIsAdmin; אחרת פשוט נסה ותקבל 401 אם לא אדמין */}
                {admin !== false && (
                  <button
                    className="mm-btn mm-pressable"
                    onClick={() => stopGroup(String(g._id))}
                    title="עצירת קבוצה (אדמין)"
                  >
                    עצור קבוצה
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
