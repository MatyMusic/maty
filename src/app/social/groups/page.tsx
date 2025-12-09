"use client";
import * as React from "react";
import { PlusCircle, CheckCircle2 } from "lucide-react";
import type { GroupLite } from "@/types/social";

export default function GroupsPage() {
  const [items, setItems] = React.useState<GroupLite[]>([]);
  const [name, setName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [sport, setSport] = React.useState("");

  async function load() {
    const res = await fetch("/api/social/groups", { cache: "no-store" });
    const j = await res.json();
    if (j.ok) setItems(j.items || []);
  }
  React.useEffect(() => {
    load();
  }, []);

  async function create() {
    const res = await fetch("/api/social/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, city, sport }),
    });
    const j = await res.json();
    if (j.ok) {
      setName("");
      setCity("");
      setSport("");
      window.dispatchEvent(
        new CustomEvent("mm:toast", {
          detail: { type: "success", text: "קבוצה נפתחה וממתינה לאישור" },
        }),
      );
      load();
    } else {
      window.dispatchEvent(
        new CustomEvent("mm:toast", {
          detail: { type: "error", text: j.error || "שגיאה" },
        }),
      );
    }
  }

  return (
    <main dir="rtl" className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">קבוצות</h1>

      <section className="rounded-2xl border p-4 bg-white/70 dark:bg-white/10">
        <div className="font-semibold mb-2">פתח/י קבוצה חדשה</div>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="שם הקבוצה"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="עיר"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="סוג פעילות (אופציונלי)"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <button
            onClick={create}
            className="inline-flex items-center gap-1 rounded-xl border bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
          >
            <PlusCircle size={16} /> פתח/י קבוצה
          </button>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-2 font-semibold">קבוצות קיימות</div>
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((g) => (
            <li
              key={g.id}
              className="rounded-2xl border p-4 bg-white/70 dark:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-sm opacity-70">
                    {g.city || "ללא עיר"} · {g.sport || "כללי"}
                  </div>
                </div>
                {g.approved ? (
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 size={16} /> מאושר
                  </span>
                ) : (
                  <span className="text-xs opacity-70">ממתין לאישור</span>
                )}
              </div>
              <div className="mt-2 text-xs opacity-70">
                {g.membersCount} חברים
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
