// "use client";

// import { useEffect } from "react";

// const ALLOWED = new Set(["he", "en", "fr", "ru"]);

// function readCookie(name: string) {
//   const m = document.cookie.split("; ").find((x) => x.startsWith(name + "="));
//   return m ? decodeURIComponent(m.split("=")[1]) : null;
// }

// function applyLang(lc: string | null) {
//   const norm = (lc || "").toLowerCase().split("-")[0];
//   const safe = ALLOWED.has(norm) ? norm : "he";
//   const dir = safe === "he" ? "rtl" : "ltr";
//   const html = document.documentElement;
//   if (html.lang !== safe) html.lang = safe;
//   if (html.dir !== dir) html.dir = dir;
//   // מראה ב-localStorage למאזינים אחרים (אופציונלי)
//   try {
//     localStorage.setItem("mm_locale_mirror", safe);
//   } catch {}
// }

// export default function LangBoot() {
//   useEffect(() => {
//     // 1) בהעלאה ראשונה – קרא קוקי ויישם
//     applyLang(readCookie("mm_locale"));

//     // 2) הגיב לשינויים שנשלחים מאפליקציה
//     const onCustom = (e: Event) => {
//       // @ts-ignore
//       const lc = (e as CustomEvent)?.detail?.locale ?? null;
//       applyLang(lc ?? readCookie("mm_locale"));
//     };
//     window.addEventListener("mm:localeChanged", onCustom as EventListener);

//     // 3) אם מישהו שינה מראה ב-localStorage (טאב אחר)
//     const onStorage = (e: StorageEvent) => {
//       if (e.key === "mm_locale_mirror") applyLang(e.newValue);
//     };
//     window.addEventListener("storage", onStorage);

//     return () => {
//       window.removeEventListener("mm:localeChanged", onCustom as EventListener);
//       window.removeEventListener("storage", onStorage);
//     };
//   }, []);

//   return null;
// }

"use client";

import { useEffect } from "react";
import type { Locale } from "@/components/i18n/useLocaleClient";

export default function LangBoot() {
  useEffect(() => {
    try {
      const m =
        document.cookie.split("; ").find((x) => x.startsWith("mm_locale=")) ||
        "";
      const lc = (m.split("=")[1] || "").toLowerCase() as Locale;
      const chosen: Locale = (["he", "en", "fr", "ru"] as const).includes(lc)
        ? lc
        : "he";
      if (document.documentElement.lang !== chosen) {
        document.documentElement.lang = chosen;
      }
      const dir = chosen === "he" ? "rtl" : "ltr";
      if (document.documentElement.dir !== dir) {
        document.documentElement.dir = dir;
      }
    } catch {}
  }, []);
  return null;
}
