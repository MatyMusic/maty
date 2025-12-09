"use client";

import Link from "next/link";

export default function AiToolsWidget() {
  return (
    <section className="rounded-2xl border border-indigo-600/50 bg-gradient-to-br from-indigo-900/70 via-neutral-900 to-fuchsia-900/60 p-3 shadow-xl shadow-indigo-900/50">
      <header className="mb-2">
        <h2 className="text-sm font-semibold text-neutral-50">
          AI CLUB – יצירה חכמה
        </h2>
        <p className="text-xs text-neutral-200">
          תן ל־AI לעזור לך לכתוב פוסטים, תגובות וחידונים.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Link
          href="/ai?mode=club-post"
          className="rounded-xl bg-neutral-900/70 px-2 py-2 text-neutral-100 hover:bg-neutral-800/80"
        >
          ✍️ פוסט עם AI
          <div className="mt-0.5 text-[11px] text-neutral-300">
            רעיונות, ניסוח, כותרת.
          </div>
        </Link>

        <Link
          href="/ai?mode=club-comment"
          className="rounded-xl bg-neutral-900/70 px-2 py-2 text-neutral-100 hover:bg-neutral-800/80"
        >
          💬 תגובה חכמה
          <div className="mt-0.5 text-[11px] text-neutral-300">
            תגובות מצחיקות / חכמות.
          </div>
        </Link>

        <Link
          href="/ai?mode=club-quiz"
          className="rounded-xl bg-neutral-900/70 px-2 py-2 text-neutral-100 hover:bg-neutral-800/80"
        >
          🎯 חידון לקהילה
          <div className="mt-0.5 text-[11px] text-neutral-300">
            בנה חידון על המוזיקה / CLUB.
          </div>
        </Link>

        <Link
          href="/ai?mode=tags"
          className="rounded-xl bg-neutral-900/70 px-2 py-2 text-neutral-100 hover:bg-neutral-800/80"
        >
          🏷️ תגיות חכמות
          <div className="mt-0.5 text-[11px] text-neutral-300">
            הצעות לטאגים ופילטרים.
          </div>
        </Link>
      </div>
    </section>
  );
}
