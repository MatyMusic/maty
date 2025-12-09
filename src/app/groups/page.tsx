// src/app/groups/page.tsx
"use client";

import * as React from "react";
type Group = {
  _id: string;
  title: string;
  description?: string;
  sports: string[];
  city?: string | null;
  membersCount: number;
};

export default function GroupsIndexPage() {
  const [items, setItems] = React.useState<Group[]>([]);
  const [q, setQ] = React.useState("");
  const [sport, setSport] = React.useState<string>("");
  const [city, setCity] = React.useState<string>("");

  React.useEffect(() => {
    const u = new URL("/api/groups", window.location.origin);
    if (q.trim()) u.searchParams.set("q", q.trim());
    if (sport) u.searchParams.set("sport", sport);
    if (city.trim()) u.searchParams.set("city", city.trim());
    fetch(u.toString(), { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setItems(j.items || []))
      .catch(() => setItems([]));
  }, [q, sport, city]);

  return (
    <main className="container-section section-padding rtl" dir="rtl">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">קבוצות ספורט</h1>
        <p className="text-sm text-muted-foreground">
          קבוצות מאושרות בלבד. ניתן לפתוח קבוצה חדשה — באישור אדמין.
        </p>
      </header>

      <section className="mm-card p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-2">
          <div>
            <label className="form-label">חיפוש</label>
            <input
              className="mm-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="שם קבוצה / תיאור"
            />
          </div>
          <div>
            <label className="form-label">סוג אימון</label>
            <select
              className="mm-select"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            >
              <option value="">הכול</option>
              {[
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
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">עיר</label>
            <input
              className="mm-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="לדוגמה: תל אביב"
            />
          </div>
          <div className="flex items-end">
            <a
              href="/groups/new"
              className="mm-btn mm-btn-primary w-full text-center"
            >
              פתח/י קבוצה חדשה
            </a>
          </div>
        </div>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <li key={g._id} className="mm-card p-4">
            <div className="font-bold text-lg clamp-1">{g.title}</div>
            <div className="text-sm opacity-80 clamp-2 mt-1">
              {g.description || "ללא תיאור"}
            </div>
            <div className="mt-2 text-xs opacity-70">
              {g.sports?.join(" • ") || "כללי"}
              {g.city ? ` • ${g.city}` : ""} • {g.membersCount} חברים
            </div>
            <div className="mt-3">
              <a href={`/groups/${g._id}`} className="mm-btn">
                כניסה
              </a>
            </div>
          </li>
        ))}
      </ul>

      {!items.length && (
        <p className="text-sm text-muted-foreground mt-4">
          אין קבוצות להצגה כרגע.
        </p>
      )}
    </main>
  );
}
