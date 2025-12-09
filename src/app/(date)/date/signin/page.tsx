"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function MatyDateSignInRedirect() {
  const sp = useSearchParams();
  const router = useRouter();

  // נחזור לכאן אחרי ההרשמה/כניסה
  const callbackUrl = sp.get("callbackUrl") || "/date";
  const target = `/auth?mode=register&from=${encodeURIComponent(callbackUrl)}`;

  useEffect(() => {
    const t = setTimeout(() => router.replace(target), 700);
    return () => clearTimeout(t);
  }, [router, target]);

  return (
    <main
      dir="rtl"
      className="min-h-dvh grid place-items-center bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
    >
      <section className="mx-auto max-w-md my-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-neutral-900/70 p-6 md:p-8 shadow-card text-right">
        <h1 className="text-2xl font-extrabold">נדרשת הרשמה</h1>
        <p className="opacity-80 text-sm mt-2">
          כדי להיכנס ל-<b>MATY-DATE</b> חייבים להירשם/להתחבר לאתר הכללי.
        </p>

        <a
          href={target}
          className="mm-btn mm-btn-primary h-11 rounded-xl grid place-items-center mt-4"
        >
          מעבר מיידי להרשמה
        </a>
        <p className="text-xs opacity-60 mt-2">
          אם לא הופנית אוטומטית — לחץ על הכפתור.
        </p>
      </section>
    </main>
  );
}
