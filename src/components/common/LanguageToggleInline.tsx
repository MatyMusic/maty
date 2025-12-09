// components/.../LanguageToggleInline.tsx (או בתוך Header כפי שיש לך)
"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type Locale = "he" | "en" | "fr" | "ru";
const ALLOWED: Locale[] = ["he", "en", "fr", "ru"];
const NEXT: Record<Locale, Locale> = { he: "en", en: "fr", fr: "ru", ru: "he" };
const LABEL: Record<Locale, string> = {
  he: "HE",
  en: "EN",
  fr: "FR",
  ru: "RU",
};

export default function LanguageToggleInline({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [lc, setLc] = useState<Locale>("he");

  useEffect(() => {
    try {
      const html = (
        document.documentElement.lang || "he"
      ).toLowerCase() as Locale;
      if (ALLOWED.includes(html)) setLc(html);
    } catch {}
  }, []);

  function goto(nextLc: Locale) {
    try {
      document.cookie = `mm_locale=${nextLc}; path=/; max-age=31536000; samesite=lax`;
      document.cookie = `NEXT_LOCALE=${nextLc}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = nextLc;
      document.documentElement.dir = nextLc === "he" ? "rtl" : "ltr";
    } catch {}

    // לא שוברים נתיב; רענון רך כדי שה-SSR יעלה עם ה-cookie
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => goto(NEXT[lc])}
      className={[
        "inline-flex h-10 items-center justify-center rounded-full px-3 text-xs font-bold",
        "border border-black/10 dark:border-white/10",
        "bg-white/85 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-800",
        "transition",
        className,
      ].join(" ")}
      title="החלף שפה"
      aria-label="החלף שפה"
    >
      {LABEL[lc]}
    </button>
  );
}
