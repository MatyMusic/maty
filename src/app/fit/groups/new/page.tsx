"use client";

import * as React from "react";

const SPORTS = [
  "running",
  "walking",
  "gym",
  "yoga",
  "pilates",
  "hiit",
  "cycling",
  "crossfit",
  "swimming",
  "football",
  "basketball",
] as const;
type Sport = (typeof SPORTS)[number];

export default function FitGroupNewPage() {
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [city, setCity] = React.useState("");
  const [sports, setSports] = React.useState<Sport[]>([]);
  const [level, setLevel] = React.useState("");
  const [visibility, setVisibility] = React.useState<"public" | "private">(
    "public",
  );
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  function toggleSport(s: Sport) {
    setSports((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function submit() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const r = await fetch("/api/fit/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          city,
          sports,
          level: level || null,
          visibility,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || "שגיאה בשליחה");
      setMsg("הבקשה נשלחה וממתינה לאישור מנהל.");
      setTitle("");
      setSlug("");
      setDescription("");
      setCity("");
      setSports([]);
      setLevel("");
      setVisibility("public");
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 rtl" dir="rtl">
      <h1 className="text-2xl font-bold mb-2">פתיחת קבוצה חדשה</h1>
      <p className="text-sm text-muted-foreground mb-4">
        לאחר הגשה — הקבוצה תוצג רק לאחר אישור מנהל.
      </p>

      <div className="mm-card p-4 space-y-3">
        <div>
          <label className="form-label">שם קבוצה</label>
          <input
            className="mm-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">סלאג (לטיני)</label>
          <input
            className="mm-input input-ltr"
            placeholder="tel-aviv-runners"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">תיאור</label>
          <textarea
            className="mm-textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">עיר</label>
          <input
            className="mm-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">סוגי אימון</label>
          <div className="flex flex-wrap gap-1.5">
            {SPORTS.map((s) => {
              const on = sports.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSport(s)}
                  className={`h-9 px-3 rounded-full border text-sm ${on ? "bg-amber-500 text-white border-amber-500" : "bg-white/90 dark:bg-neutral-950/80"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="form-label">רמה</label>
            <select
              className="mm-select"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="">ללא</option>
              <option value="beginner">מתחילים</option>
              <option value="intermediate">ביניים</option>
              <option value="advanced">מתקדמים</option>
            </select>
          </div>
          <div>
            <label className="form-label">נראות</label>
            <select
              className="mm-select"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
            >
              <option value="public">ציבורית</option>
              <option value="private">פרטית</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button disabled={busy} onClick={submit} className="mm-btn">
            שליחה לאישור
          </button>
          {msg && <div className="text-green-700 text-sm">{msg}</div>}
          {err && <div className="text-red-600 text-sm">{err}</div>}
        </div>
      </div>
    </main>
  );
}
