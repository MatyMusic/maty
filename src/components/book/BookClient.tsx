"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilityCalendar from "@/components/calendar/AvailabilityCalendar";

type Num = number | "";

export default function BookClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [eventDate, setEventDate] = useState<string>("");

  const [extraHours, setExtraHours] = useState<Num>(0);
  const [soundSystem, setSoundSystem] = useState(false);
  const [extraMusicians, setExtraMusicians] = useState<Num>(0);
  const [distanceKm, setDistanceKm] = useState<Num>(0);
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  const input =
    "w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-[15px] px-3 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40 transition";

  const total = useMemo(() => {
    const base = 2900;
    const extra = Number(extraHours || 0) * 200;
    const sound = soundSystem ? 500 : 0;
    const players = Number(extraMusicians || 0) * 1800;
    const dist = Number(distanceKm || 0) > 100 ? 100 : 0;
    return base + extra + sound + players + dist;
  }, [extraHours, soundSystem, extraMusicians, distanceKm]);

  // ולידציית אימייל + הודעת הכוונה
  const emailValid = !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const emailMsg = !email
    ? "יש להזין אימייל כדי לקבל אישור הזמנה במייל."
    : !emailValid
    ? "אימייל לא תקין — בדוק/י שוב."
    : "✅ אישור הזמנה יישלח למייל הזה מיד לאחר השליחה.";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!eventDate) return alert("בחר/י תאריך");
    if (!emailValid) return alert("יש להזין אימייל תקין");

    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          phone,
          eventDate,
          extraHours: Number(extraHours || 0),
          soundSystem,
          extraMusicians: Number(extraMusicians || 0),
          distanceKm: Number(distanceKm || 0),
          note,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        if (j?.error === "date_busy") alert("התאריך כבר תפוס");
        else if (j?.error === "invalid_date") alert("תאריך לא תקין");
        else alert(j?.error || "שגיאה בשליחה");
        setLoading(false);
        return;
      }

      const ref = j.bookingId;
      const amount = j.amount;
      router.push(`/checkout/preview?ref=${encodeURIComponent(ref)}&amount=${encodeURIComponent(amount)}`);
    } catch (err: any) {
      alert(err?.message || "שגיאה לא צפויה");
      setLoading(false);
    }
  }

  return (
    <div className="container-section section-padding grid md:grid-cols-2 gap-6" dir="rtl">
      <form onSubmit={onSubmit} className="space-y-4">
        <h1 className="text-2xl md:text-3xl font-extrabold">הזמנה</h1>

        <label className="grid gap-2">
          <div className="font-semibold">בחר/י תאריך</div>
          <AvailabilityCalendar initialDate={new Date()} onSelect={(dateKey) => setEventDate(dateKey)} />
          {eventDate && <div className="text-sm opacity-80">נבחר: {eventDate}</div>}
        </label>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm">שם</span>
            <input className={input + " input-rtl"} value={name} onChange={(e) => setName(e.target.value)} placeholder="שם מלא / איש קשר" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">אימייל *</span>
            <input
              className={input + " input-ltr"}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!email && !emailValid}
            />
            <small className={`mt-1 block text-[13px] ${emailValid ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {emailMsg}
            </small>
          </label>
          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm">טלפון</span>
            <input className={input + " input-ltr"} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-..." />
          </label>
        </div>

        <fieldset className="grid gap-3 border rounded-2xl p-3 border-black/10 dark:border-white/10">
          <legend className="px-1 text-sm opacity-80">תוספות</legend>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm">שעות נוספות (₪200 לשעה)</span>
              <input
                className={input + " input-ltr"}
                type="number"
                min={0}
                max={12}
                value={extraHours}
                onChange={(e) => setExtraHours(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">נגנים נוספים (₪1,800 לנגן)</span>
              <input
                className={input + " input-ltr"}
                type="number"
                min={0}
                max={8}
                value={extraMusicians}
                onChange={(e) => setExtraMusicians(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
              />
            </label>

            <label className="inline-flex items-center gap-2 mt-1">
              <input type="checkbox" checked={soundSystem} onChange={(e) => setSoundSystem(e.target.checked)} />
              <span>כולל הגברה (₪500)</span>
            </label>

            <label className="grid gap-1">
              <span className="text-sm">מרחק (ק״מ)</span>
              <input
                className={input + " input-ltr"}
                type="number"
                min={0}
                max={2000}
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                placeholder="תוספת ₪100 מעל 100 ק״מ"
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm">הערות</span>
            <textarea className={input + " input-rtl h-24 py-2"} value={note} onChange={(e) => setNote(e.target.value)} placeholder="פרטים נוספים חשובים לאירוע (אופציונלי)" />
          </label>
        </fieldset>

        <button type="submit" disabled={loading || !eventDate || !emailValid} className="btn bg-brand text-white border-0 hover:opacity-90 disabled:opacity-60">
          {loading ? "שולח..." : "המשך לתשלום"}
        </button>
      </form>

      <aside className="card p-4">
        <h2 className="font-bold mb-2">סיכום מחיר משוער</h2>
        <ul className="text-sm space-y-1">
          <li>בסיס: ₪2,900</li>
          <li>שעות נוספות: ₪{Number(extraHours || 0) * 200}</li>
          <li>הגברה: ₪{soundSystem ? 500 : 0}</li>
          <li>נגנים נוספים: ₪{Number(extraMusicians || 0) * 1800}</li>
          <li>נסיעה: ₪{Number(distanceKm || 0) > 100 ? 100 : 0}</li>
        </ul>
        <div className="mt-3 text-lg font-extrabold">סה״כ: ₪{total}</div>
        <p className="text-xs opacity-70 mt-1">לאחר אישור התשלום יישלח אליך מייל סיכום אוטומטי כולל PDF.</p>
      </aside>
    </div>
  );
}
