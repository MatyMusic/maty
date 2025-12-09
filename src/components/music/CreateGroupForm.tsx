// src/components/music/CreateGroupForm.tsx
"use client";

import * as React from "react";

export default function CreateGroupForm({
  defaultRadiusKm = 10,
  onCreated,
}: {
  defaultRadiusKm?: number;
  onCreated?: (item: any) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [lat, setLat] = React.useState<number | "">("");
  const [lng, setLng] = React.useState<number | "">("");
  const [radiusKm, setRadiusKm] = React.useState<number>(defaultRadiusKm);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function useMyLocation() {
    setErr(null);
    if (!("geolocation" in navigator)) {
      setErr("הדפדפן לא תומך במיקום");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
      },
      (e) => setErr(e?.message || "נכשל להשיג מיקום"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!title.trim()) return setErr("חסר שם קבוצה");
    if (lat === "" || lng === "") return setErr("חסר מיקום (Lat/Lng)");

    setBusy(true);
    try {
      const res = await fetch("/api/music/groups", {
        method: "POST",
        credentials: "same-origin", // חשוב כדי שהסשן/קוקיז יגיעו
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: title.trim(),
          desc: desc.trim(),
          lat: Number(lat),
          lng: Number(lng),
          radiusKm: Number(radiusKm) || 0,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`);

      // ניקוי טופס
      setTitle("");
      setDesc("");
      // לא מאפס מיקום בכוונה
      if (onCreated) onCreated(j.item);
      try {
        window.dispatchEvent(
          new CustomEvent("mm:toast", {
            detail: { type: "success", text: "קבוצה נפתחה" },
          }),
        );
      } catch {}
    } catch (e: any) {
      setErr(e?.message || "שגיאה ביצירה (בדוק הרשאות/סשן)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} dir="rtl" className="mm-card p-4 space-y-3">
      <div className="text-lg font-bold">פתח קבוצה חדשה</div>
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs opacity-70">שם קבוצה</span>
          <input
            className="mm-input input-rtl"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="לדוגמה: JAM חמישי בערב"
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs opacity-70">תיאור</span>
          <input
            className="mm-input input-rtl"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="סוג מוזיקה / מיוזיקאים / הערות"
          />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs opacity-70">Latitude</span>
          <input
            className="mm-input"
            value={lat}
            onChange={(e) =>
              setLat(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="31.872612"
            type="number"
            step="0.000001"
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs opacity-70">Longitude</span>
          <input
            className="mm-input"
            value={lng}
            onChange={(e) =>
              setLng(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="35.170253"
            type="number"
            step="0.000001"
            required
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs opacity-70">רדיוס (ק״מ)</span>
          <input
            className="mm-input"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            type="number"
            min={0}
            step="0.5"
          />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          className="mm-btn mm-pressable"
        >
          קח מיקום נוכחי
        </button>
        <button type="submit" disabled={busy} className="mm-btn mm-pressable">
          {busy ? "פותח…" : "פתח קבוצה"}
        </button>
      </div>
    </form>
  );
}
