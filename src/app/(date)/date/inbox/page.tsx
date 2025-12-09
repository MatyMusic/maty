// src/app/(date)/date/inbox/page.tsx
import Link from "next/link";

export default function DateInboxPage() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-white"
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              💌 תיבת הודעות – MATY-DATE
            </h1>
            <p className="mt-1 text-sm opacity-80">
              כאן תראה/י הודעות פרטיות מההתאמות שלך.
            </p>
          </div>
          <Link
            href="/date/matches"
            className="h-10 px-4 rounded-full text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700"
          >
            חזרה להתאמות
          </Link>
        </header>

        <section className="mt-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-4 md:p-6 shadow-card">
          <div className="text-center py-10">
            <div className="text-xl font-extrabold">אין הודעות חדשות</div>
            <p className="mt-2 text-sm opacity-75">
              ברגע שתתחיל/י להתכתב – ההודעות יופיעו כאן.
            </p>
            <div className="mt-4">
              <Link
                href="/date/matches"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
              >
                מצאו התאמות חדשות ❤
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
