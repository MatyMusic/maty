// src/app/(date)/date/edit/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "עריכת פרופיל היכרות | MATY-DATE",
  description: "מסך עריכת פרופיל ההיכרות של MATY-DATE בבנייה.",
};

export default function DateEditPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 px-4 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          עריכת פרופיל – MATY-DATE
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          מסך עריכת הפרופיל המלא עדיין בבנייה.
          <br />
          בינתיים אפשר לעדכן חלק מהפרטים מדף הפרופיל הראשי.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/date/profile/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
          >
            לעמוד הפרופיל שלי
          </Link>

          <Link
            href="/date/"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            חזרה למסך הראשי של MATY-DATE
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
        <p className="font-semibold mb-1">מצב פיתוח</p>
        <p>
          כאן בעתיד יחיה הWizard המלא לעריכת פרופיל היכרות (שלבים, תצוגת
          התקדמות, העלאת תמונות, העדפות וכו').
        </p>
      </section>
    </main>
  );
}
