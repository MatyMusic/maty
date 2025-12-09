export const dynamic = "force-dynamic";

export const metadata = {
  title: "הגישה נחסמה • MATY MUSIC",
  description: "החשבון חסום. ניתן לפנות אלינו לבירור או ערעור על ההחלטה.",
};

export default function BlockedPage() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh flex items-center justify-center px-4 py-12 bg-gradient-to-b from-white to-rose-50/30 dark:from-neutral-950 dark:to-rose-950/10"
    >
      <div className="w-full max-w-xl rounded-2xl border dark:border-neutral-800/60 bg-white/90 dark:bg-neutral-950/90 backdrop-blur p-6 sm:p-8 shadow-xl">
        <header className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            הגישה שלך נחסמה
          </h1>
          <p className="text-sm opacity-70 mt-1">
            מסיבות של שמירה על קהילה מכובדת ונקיה, החשבון אינו זמין כרגע.
          </p>
        </header>

        <section className="space-y-4 text-sm leading-7">
          <div className="rounded-xl border dark:border-neutral-800/60 p-4 bg-neutral-50/80 dark:bg-neutral-900/60">
            <div className="font-medium mb-1">מה אפשר לעשות?</div>
            <ul className="list-disc me-6 space-y-1">
              <li>לפנות אלינו לבירור—נבקש פרטים מזהים ונסביר את מצב החשבון.</li>
              <li>
                במקרים מסוימים ניתן לשקול החזרה עם תנאי שימוש מחמירים יותר.
              </li>
            </ul>
          </div>
          <p className="opacity-80">
            אם לדעתך מדובר בטעות, נשמח לבדוק זאת במהירות.
          </p>
        </section>

        <footer className="mt-6 flex flex-wrap gap-3">
          <a
            href="/contact"
            className="rounded-xl border px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            צרו קשר לבירור
          </a>
          <a
            href="/"
            className="rounded-xl border px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            חזרה לדף הבית
          </a>
        </footer>
      </div>
    </main>
  );
}
