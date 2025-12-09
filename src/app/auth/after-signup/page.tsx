"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AfterSignupPage() {
  const sp = useSearchParams();
  const from = sp.get("from") || "/date";

  return (
    <main className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-neutral-100 to-white dark:from-neutral-900 dark:to-neutral-950 p-4">
      <div className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur shadow-xl p-6 text-right">
        <h1 className="text-2xl font-extrabold mb-2">נרשמת בהצלחה 🎉</h1>
        <p className="text-sm opacity-80 mb-4">
          החשבון שלך נוצר וההתחברות בוצעה. עכשיו בוא נבחר לאן להמשיך.
        </p>

        <div className="space-y-3 mt-4">
          <Link
            href={from}
            className="w-full text-center block rounded-xl py-2 bg-black text-white hover:brightness-95"
          >
            💞 המשך ל-MATY-DATE
          </Link>

          <Link
            href="/"
            className="w-full text-center block rounded-xl py-2 border border-black/10 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5"
          >
            🏠 חזרה לדף הבית
          </Link>
        </div>

        <p className="text-[11px] opacity-60 mt-4">
          תמיד אפשר לחזור ל-MATY-DATE מהתפריט הראשי באתר.
        </p>
      </div>
    </main>
  );
}
