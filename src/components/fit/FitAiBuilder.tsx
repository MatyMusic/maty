// src/components/fit/FitAiBuilder.tsx
"use client";

import { useSession } from "next-auth/react";
import * as React from "react";

type FitLevel = "beginner" | "intermediate" | "advanced";
type FitGoal = "fat_loss" | "muscle_gain" | "endurance" | "general";

type FitExercise = {
  name: string;
  sets: number;
  reps?: number;
  timeSec?: number;
  restSec?: number;
};

type FitDay = {
  dayIndex: number;
  title: string;
  notes?: string;
  exercises: FitExercise[];
};

type FitProgram = {
  _id: string;
  goal: FitGoal;
  level: FitLevel;
  daysPerWeek: number;
  equipment: string[];
  plan: FitDay[];
  createdAt?: string;
};

type ApiResp =
  | { ok: true; program: FitProgram }
  | { ok: false; error?: string; message?: string };

const EQUIP_PRESETS = [
  "ספה / ספסל",
  "משקולות יד (20 קילו)",
  "מכשיר שכיבות שמיכה",
  "מכשיר מתח",
  "גומיות",
];

export default function FitAiBuilder() {
  const { data: session } = useSession();
  const [goal, setGoal] = React.useState<FitGoal>("fat_loss");
  const [level, setLevel] = React.useState<FitLevel>("intermediate");
  const [daysPerWeek, setDaysPerWeek] = React.useState(4);
  const [equipment, setEquipment] = React.useState<string[]>([
    "ספה / ספסל",
    "משקולות יד (20 קילו)",
    "מכשיר שכיבות שמיכה",
    "מכשיר מתח",
  ]);
  const [customEquip, setCustomEquip] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [program, setProgram] = React.useState<FitProgram | null>(null);

  const userId =
    (session?.user as any)?.id || (session?.user as any)?._id || "guest";

  function toggleEquip(item: string) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/fit/ai-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          goal,
          level,
          daysPerWeek,
          equipment,
        }),
      });
      const data: ApiResp = await res.json();
      if (!data.ok) {
        setError(data.error || data.message || "שגיאה בבניית התוכנית");
      } else {
        setProgram(data.program);
      }
    } catch (err) {
      setError("לא הצלחתי להתחבר לשרת. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  function addCustomEquip() {
    const v = customEquip.trim();
    if (!v) return;
    setEquipment((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setCustomEquip("");
  }

  return (
    <section className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-900/30 via-slate-950 to-black p-4 shadow-lg shadow-emerald-500/25 md:p-6">
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-emerald-300 md:text-xl">
            MATY-FIT · AI
          </h1>
          <p className="text-xs text-emerald-100/80 md:text-sm">
            ענה בכמה קליקים – וה־AI בונה לך תוכנית אימונים לפי מטרה, רמה והציוד
            שיש בבית.
          </p>
        </div>
        {session?.user && (
          <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-100">
            מחובר כ־{" "}
            <span className="font-semibold">
              {(session.user.name as string) || (session.user.email as string)}
            </span>
          </div>
        )}
      </header>

      {/* טופס */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end"
      >
        {/* מטרה */}
        <div className="space-y-1 text-xs">
          <label className="block text-emerald-100/80">מטרה</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as FitGoal)}
            className="w-full rounded-xl border border-emerald-500/40 bg-black/40 px-3 py-2 text-xs text-emerald-50 outline-none ring-emerald-500/40 focus:ring-2"
          >
            <option value="fat_loss">הורדת שומן / חיטוב</option>
            <option value="muscle_gain">עלייה במסת שריר</option>
            <option value="endurance">שיפור סיבולת</option>
            <option value="general">שמירה כללית על כושר</option>
          </select>
        </div>

        {/* רמה */}
        <div className="space-y-1 text-xs">
          <label className="block text-emerald-100/80">רמת אימון</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as FitLevel)}
            className="w-full rounded-xl border border-emerald-500/40 bg-black/40 px-3 py-2 text-xs text-emerald-50 outline-none ring-emerald-500/40 focus:ring-2"
          >
            <option value="beginner">מתחיל</option>
            <option value="intermediate">ביניים (כמוך 😉)</option>
            <option value="advanced">מתקדם</option>
          </select>
        </div>

        {/* ימים בשבוע */}
        <div className="space-y-1 text-xs">
          <label className="block text-emerald-100/80">כמה ימים בשבוע?</label>
          <input
            type="number"
            min={2}
            max={7}
            value={daysPerWeek}
            onChange={(e) =>
              setDaysPerWeek(
                Math.min(7, Math.max(2, Number(e.target.value) || 2)),
              )
            }
            className="w-full rounded-xl border border-emerald-500/40 bg-black/40 px-3 py-2 text-xs text-emerald-50 outline-none ring-emerald-500/40 focus:ring-2"
          />
        </div>

        {/* ציוד מוכן */}
        <div className="md:col-span-2">
          <p className="mb-1 text-[11px] text-emerald-100/80">
            איזה ציוד יש לך?
          </p>
          <div className="flex flex-wrap gap-2">
            {EQUIP_PRESETS.map((item) => {
              const active = equipment.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleEquip(item)}
                  className={`rounded-full px-3 py-1 text-[11px] transition ${
                    active
                      ? "bg-emerald-400 text-black shadow-sm"
                      : "bg-black/40 text-emerald-100/80 ring-1 ring-emerald-500/40 hover:bg-black/70"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* ציוד מותאם אישית */}
        <div className="space-y-1 text-xs">
          <label className="block text-emerald-100/80">
            תוסיף ציוד מיוחד (אופציונלי)
          </label>
          <div className="flex gap-2">
            <input
              value={customEquip}
              onChange={(e) => setCustomEquip(e.target.value)}
              placeholder="לדוגמה: ג׳ימבו/אליפטיקל..."
              className="flex-1 rounded-xl border border-emerald-500/40 bg-black/40 px-3 py-2 text-[11px] text-emerald-50 outline-none ring-emerald-500/40 focus:ring-2"
            />
            <button
              type="button"
              onClick={addCustomEquip}
              className="rounded-xl bg-emerald-500 px-3 py-2 text-[11px] font-semibold text-black hover:bg-emerald-400"
            >
              הוסף
            </button>
          </div>
        </div>

        {/* כפתור */}
        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? "בונה לך תוכנית..." : "בנה לי תוכנית אימונים"}
            {!loading && <span>💪</span>}
          </button>
        </div>
      </form>

      {/* שגיאה */}
      {error && <p className="mt-3 text-xs text-red-300">❗ {error}</p>}

      {/* תצוגת תוכנית */}
      {program && (
        <div className="mt-5 space-y-3">
          <h2 className="text-sm font-semibold text-emerald-200">
            התוכנית שלך ({program.daysPerWeek} אימונים בשבוע)
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {program.plan.map((day) => (
              <article
                key={day.dayIndex}
                className="rounded-2xl border border-emerald-500/25 bg-black/50 p-3 text-xs"
              >
                <header className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-emerald-300">
                      יום {day.dayIndex}: {day.title}
                    </h3>
                    {day.notes && (
                      <p className="mt-0.5 text-[11px] text-emerald-100/80">
                        {day.notes}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-200">
                    {day.exercises.length} תרגילים
                  </span>
                </header>
                <ul className="space-y-1.5">
                  {day.exercises.map((ex, idx) => (
                    <li
                      key={`${day.dayIndex}-${idx}`}
                      className="flex items-start justify-between gap-2"
                    >
                      <div className="text-[11px] text-emerald-50">
                        <span className="font-semibold">{ex.name}</span>
                      </div>
                      <div className="text-[10px] text-emerald-200/90 text-left">
                        {ex.reps && (
                          <div>
                            {ex.sets} סטים × {ex.reps} חזרות
                          </div>
                        )}
                        {ex.timeSec && (
                          <div>
                            {ex.sets} סטים × {ex.timeSec} שניות
                          </div>
                        )}
                        {ex.restSec && (
                          <div className="text-emerald-300/80">
                            מנוחה: {ex.restSec} שניות
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
