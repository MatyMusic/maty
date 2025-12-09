"use client";

import { useEffect, useMemo, useState } from "react";

type DayStatus = "free" | "busy" | "hold";
type AvailabilityMap = Record<string, DayStatus>;

function ymdLocal(d: Date) {
  // מוודא YYYY-MM-DD מקומי (בלי החלקת אזור־זמן ליום קודם)
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function monthBounds(anchor: Date) {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  // נרחיב טווח טעינה כדי לכלול ימים לפני/אחרי למעבר חלק
  return {
    first,
    last,
    fetchFrom: addDays(first, -10),
    fetchTo: addDays(last, 10),
  };
}

export default function AvailabilityCalendar({
  value,
  onSelect,
  initialDate,
  disabledBeforeToday = true,
}: {
  value?: string; // YYYY-MM-DD
  onSelect: (dateKey: string) => void;
  initialDate?: Date;
  disabledBeforeToday?: boolean;
}) {
  const [cursor, setCursor] = useState<Date>(initialDate ?? new Date());
  const [selected, setSelected] = useState<string | null>(value ?? null);
  const [map, setMap] = useState<AvailabilityMap>({});

  const { first, last, fetchFrom, fetchTo } = useMemo(() => monthBounds(cursor), [cursor]);

  // טוען זמינות מהשרת לטווח הנוכחי
  useEffect(() => {
    const q = `/api/availability?from=${ymdLocal(fetchFrom)}&to=${ymdLocal(fetchTo)}`;
    fetch(q, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && j.map) setMap(j.map as AvailabilityMap);
      })
      .catch(() => {});
  }, [fetchFrom, fetchTo]);

  // אם value מגיע מבחוץ – לעדכן בחירה
  useEffect(() => {
    if (value) setSelected(value);
  }, [value]);

  const todayKey = ymdLocal(new Date());

  // בניית מטריצה של הימים להצגה
  const startWeekday = new Date(first.getFullYear(), first.getMonth(), 1).getDay(); // 0=א', 6=ש'
  const startPad = (startWeekday + 6) % 7; // נתחיל מיום א' (RTL) – מסדר היסט
  const totalDays = last.getDate();

  const days: Array<{ key: string; inMonth: boolean; status: DayStatus; isPast: boolean }> = [];
  // ריפוד לפני תחילת החודש
  for (let i = 0; i < startPad; i++) {
    const d = addDays(first, i - startPad);
    const key = ymdLocal(d);
    const status: DayStatus = map[key] ?? "free";
    const isPast = key < todayKey;
    days.push({ key, inMonth: false, status, isPast });
  }
  // ימי החודש
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(first.getFullYear(), first.getMonth(), i);
    const key = ymdLocal(d);
    const status: DayStatus = map[key] ?? "free";
    const isPast = key < todayKey;
    days.push({ key, inMonth: true, status, isPast });
  }
  // לרפד לסגירת שורות (עד מכפלה של 7)
  while (days.length % 7 !== 0) {
    const d = addDays(last, days.length % 7);
    const key = ymdLocal(d);
    const status: DayStatus = map[key] ?? "free";
    const isPast = key < todayKey;
    days.push({ key, inMonth: false, status, isPast });
  }

  const monthLabel = cursor.toLocaleDateString("he-IL", { year: "numeric", month: "long" });

  function handlePick(k: string, status: DayStatus, isPast: boolean) {
    if (status === "busy") return; // חסום
    if (disabledBeforeToday && isPast) return;
    setSelected(k);
    onSelect(k);
  }

  return (
    <div dir="rtl" className="w-full">
      {/* כותרת ניווט */}
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="rounded-full border px-2 py-1 text-sm bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
          aria-label="חודש קודם"
        >
          ‹
        </button>
        <div className="font-extrabold">{monthLabel}</div>
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="rounded-full border px-2 py-1 text-sm bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
          aria-label="חודש הבא"
        >
          ›
        </button>
      </div>

      {/* שמות ימים */}
      <div className="grid grid-cols-7 text-center text-xs opacity-70 mb-1">
        {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* תאים */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ key, inMonth, status, isPast }, i) => {
          const n = Number(key.slice(-2)); // יום בחודש
          const isSelected = selected === key;
          const disabled = status === "busy" || (disabledBeforeToday && isPast);

          const base =
            "relative aspect-square rounded-2xl border text-sm select-none grid place-items-center transition-all";
          const skin =
            "bg-white/80 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800";
          const selectedSkin =
            "ring-2 ring-brand border-brand shadow-inner translate-y-[1px] bg-white dark:bg-neutral-900";
          const outMonth = inMonth ? "" : "opacity-50";
          const busySkin =
            "bg-red-50/60 dark:bg-red-500/10 border-red-200/80 dark:border-red-500/40 text-red-700 dark:text-red-300 line-through cursor-not-allowed";
          const holdDot =
            status === "hold"
              ? (
                  <span
                    className="absolute top-1 right-1 h-2 w-2 rounded-full"
                    style={{ background: "radial-gradient(circle, #f59e0b, #b45309)" }}
                    title="החזקה זמנית – אפשר להמשיך"
                  />
                )
              : null;

          return (
            <button
              key={key + i}
              type="button"
              className={[
                base,
                disabled ? busySkin : skin,
                isSelected ? selectedSkin : "",
                outMonth,
              ].join(" ")}
              aria-pressed={isSelected}
              aria-label={key}
              onClick={() => handlePick(key, status, isPast)}
              title={
                status === "busy"
                  ? "תפוס"
                  : status === "hold"
                  ? "על החזקה זמנית – אפשר להזמין"
                  : "פנוי"
              }
              disabled={status === "busy"}
            >
              {n}
              {holdDot}
            </button>
          );
        })}
      </div>

      {/* מקרא */}
      <div className="mt-2 flex items-center gap-3 text-xs opacity-75">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" /> תפוס
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "radial-gradient(circle, #f59e0b, #b45309)" }} /> החזקה זמנית
        </span>
        <span>לחיצה על יום נבחר “שוקעת” פנימה</span>
      </div>
    </div>
  );
}
