// src/app/groups/new/page.tsx
"use client";

import * as React from "react";

const SPORTS_HE = [
  "ריצה",
  "הליכה",
  "חדר כושר",
  "יוגה",
  "פילאטיס",
  "HIIT",
  "אופניים",
  "קרוספיט",
  "שחייה",
  "כדורגל",
  "כדורסל",
  "אחר",
] as const;

export default function NewGroupPage() {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [city, setCity] = React.useState("");
  const [visibility, setVisibility] = React.useState<"public" | "private">(
    "public",
  );
  const [sports, setSports] = React.useState<string[]>([]);
  const [msg, setMsg] = React.useState<string>("");

  function toggle(s: string) {
    setSports((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function submit() {
    setMsg("");
    if (!title.trim() || sports.length === 0) {
      setMsg("כותרת וסוג אימון לפחות — חובה.");
      return;
    }
    const r = await fetch("/api/groups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        city: city || null,
        visibility,
        sports,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!j?.ok) {
      setMsg("שמירה נכשלה. ודא/י כניסה לחשבון ונסה/י שוב.");
      return;
    }
    setMsg("הבקשה נשלחה! נעדכן אחרי אישור אדמין.");
    setTitle("");
    setDescription("");
    setCity("");
    setSports([]);
  }

  return (
    <main className="container-section section-padding rtl" dir="rtl">
      <h1 className="text-2xl font-bold mb-3">פתיחת קבוצה</h1>
      <div className="mm-card p-4 max-w-2xl">
        <div className="mb-3">
          <label className="form-label">שם הקבוצה *</label>
          <input
            className="mm-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="לדוגמה: רצי רוטשילד"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">תיאור</label>
          <textarea
            className="mm-textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="מה הקבוצה עושה, מתי נפגשים, כללים וכו׳"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">עיר</label>
          <input
            className="mm-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="ת״א / ירושלים / נתניה..."
          />
        </div>
        <div className="mb-3">
          <label className="form-label">סוגי אימון *</label>
          <div className="flex flex-wrap gap-1.5">
            {SPORTS_HE.map((s) => {
              const active = sports.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  className={`mm-chip ${active ? "bg-brand text-white border-transparent" : ""}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">נראות</label>
          <select
            className="mm-select"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
          >
            <option value="public">ציבורית (נראית לכולם)</option>
            <option value="private">פרטית (נדרשת הזמנה)</option>
          </select>
        </div>

        {msg && <div className="text-sm mt-2">{msg}</div>}

        <div className="mt-3 flex gap-2">
          <button onClick={submit} className="mm-btn mm-btn-primary">
            שליחה לאישור אדמין
          </button>
          <a href="/groups" className="mm-btn">
            חזרה
          </a>
        </div>
      </div>
    </main>
  );
}
