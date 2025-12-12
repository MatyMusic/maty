"use client";

import React, { useState } from "react";

/**
 * טופס הזמנת הופעה מתוך עמוד האירועים
 * - אוסף: שם, אימייל, טלפון, סוג אירוע, תאריך, עיר, אולם, כמות משתתפים, הודעה
 * - שולח ל-POST /api/events/book
 * - מסומן כ-source = "events-page" כדי שתראה במערכת מאיפה זה הגיע
 */

type EventKind =
  | "wedding"
  | "bar_mitzvah"
  | "farbrengen"
  | "community"
  | "concert"
  | "other";

type Props = {
  /** אופציונלי – תאריך שיעבור כברירת מחדל (למשל מאירוע נבחר) */
  defaultDate?: string;
  /** אופציונלי – סוג אירוע ברירת מחדל */
  defaultKind?: EventKind;
};

function toast(msg: string, type: "success" | "error" | "info" = "success") {
  try {
    window.dispatchEvent(
      new CustomEvent("mm:toast", { detail: { type, text: msg } }),
    );
  } catch {
    if (type === "error") alert(msg);
  }
}

export function EventBookingForm({ defaultDate, defaultKind }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventKind, setEventKind] = useState<EventKind>(
    defaultKind || "wedding",
  );
  const [eventDate, setEventDate] = useState(defaultDate || "");
  const [eventCity, setEventCity] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventGuests, setEventGuests] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !eventDate) {
      toast("שם, אימייל ותאריך הם שדות חובה", "error");
      return;
    }

    setSubmitting(true);
    setDone(false);
    try {
      const res = await fetch("/api/events/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          eventDate,
          eventKind,
          eventCity,
          eventVenue,
          eventGuests,
          requestMessage,
          source: "events-page",
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      toast("הבקשה נקלטה! נחזור אליך עם הצעה מסודרת.", "success");
      setDone(true);
      // איפוס חלקי – את התאריך/סוג נשאיר
      setName("");
      setEmail("");
      setPhone("");
      setEventCity("");
      setEventVenue("");
      setEventGuests("");
      setRequestMessage("");
    } catch (err: any) {
      console.error(err);
      toast("אירעה שגיאה בשליחת הבקשה. נסה שוב או צור קשר בטלפון.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl p-5 sm:p-6 text-right space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">הזמנת הופעה / אירוע</h2>
        <p className="text-xs sm:text-sm opacity-75">
          מלאו את הפרטים, ציינו סוג אירוע ותאריך, ונחזור אליכם עם זמינות והצעת
          מחיר מסודרת. ההזמנה נכנסת גם למערכת הניהול וגם נשלחת אליי במייל.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        {/* שם + אימייל */}
        <div className="sm:col-span-1">
          <label className="text-xs opacity-70 mb-1 block">שם מלא *</label>
          <input
            className="mm-input input-rtl w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם איש קשר / בעל השמחה"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs opacity-70 mb-1 block">אימייל *</label>
          <input
            type="email"
            className="mm-input input-rtl w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
          />
        </div>

        {/* טלפון */}
        <div className="sm:col-span-1">
          <label className="text-xs opacity-70 mb-1 block">טלפון</label>
          <input
            className="mm-input input-rtl w-full"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="למשל: 050-000-0000"
          />
        </div>

        {/* סוג אירוע */}
        <div className="sm:col-span-1">
          <label className="text-xs opacity-70 mb-1 block">סוג אירוע</label>
          <select
            className="mm-select input-rtl w-full"
            value={eventKind}
            onChange={(e) => setEventKind(e.target.value as EventKind)}
          >
            <option value="wedding">חתונה / חופה</option>
            <option value="bar_mitzvah">בר מצווה</option>
            <option value="farbrengen">התוועדות</option>
            <option value="community">אירוע קהילתי</option>
            <option value="concert">קונצרט / מופע</option>
            <option value="other">אחר</option>
          </select>
        </div>

        {/* תאריך + עיר + אולם */}
        <div className="sm:col-span-1">
          <label className="text-xs opacity-70 mb-1 block">
            תאריך האירוע *
          </label>
          <input
            type="date"
            className="mm-input w-full"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs opacity-70 mb-1 block">עיר</label>
          <input
            className="mm-input input-rtl w-full"
            value={eventCity}
            onChange={(e) => setEventCity(e.target.value)}
            placeholder="למשל: ירושלים / לוד"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs opacity-70 mb-1 block">
            אולם / מיקום מדויק
          </label>
          <input
            className="mm-input input-rtl w-full"
            value={eventVenue}
            onChange={(e) => setEventVenue(e.target.value)}
            placeholder="שם האולם / בית חב״ד / כתובת"
          />
        </div>

        {/* משתתפים + הודעה */}
        <div className="sm:col-span-1">
          <label className="text-xs opacity-70 mb-1 block">
            כמות משוערת של משתתפים
          </label>
          <input
            className="mm-input input-rtl w-full"
            value={eventGuests}
            onChange={(e) => setEventGuests(e.target.value)}
            placeholder="לדוגמה: 150–250"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs opacity-70 mb-1 block">
            הודעה / בקשה מיוחדת
          </label>
          <textarea
            className="min-h-[90px] rounded-xl border px-3 py-2 bg-white/95 dark:bg-neutral-900/90 w-full input-rtl"
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder="ספרו קצת על סוג האירוע, גיל הקהל, סגנון מוזיקה מועדף, שירים שחייבים להיות וכו׳."
          />
        </div>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-2 mt-2">
          <button
            type="submit"
            className="mm-btn mm-pressable px-5"
            disabled={submitting}
          >
            {submitting ? "שולח..." : "שליחת בקשה לאירוע"}
          </button>
          {done && (
            <span className="text-xs sm:text-sm opacity-80">
              הבקשה נקלטה. תופיע גם במערכת ההזמנות ותישלח אליי במייל.
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
