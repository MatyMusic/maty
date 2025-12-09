// src/app/(date)/date/done/page.tsx
export const metadata = { title: "הפרופיל נשמר · MATY-DATE" };

export default function DonePage() {
  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-4 py-14">
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-8 text-center shadow-sm">
        <div className="text-3xl">🎉</div>
        <h1 className="mt-2 text-2xl font-extrabold">הפרופיל נשמר!</h1>
        <p className="mt-2 opacity-80">
          אפשר להמשיך לראות התאמות, או לחזור ולעדן את הפרופיל.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <a
            href="/date/matches"
            className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-pink-600 text-white hover:bg-pink-700"
          >
            לצפייה בהתאמות
          </a>
          <a
            href="/date/profile"
            className="inline-flex items-center gap-2 rounded-full h-10 px-5 text-sm font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
          >
            חזרה לעריכת פרופיל
          </a>
        </div>
      </div>
    </main>
  );
}
