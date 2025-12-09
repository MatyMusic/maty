"use client";

import { useEffect, useState } from "react";

export type Locale = "he" | "en" | "fr" | "ru";
const ALLOWED: readonly Locale[] = ["he", "en", "fr", "ru"] as const;
const NEXT: Record<Locale, Locale> = { he: "en", en: "fr", fr: "ru", ru: "he" };

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.split("; ").find((x) => x.startsWith(name + "="));
  return m ? decodeURIComponent(m.split("=")[1]) : null;
}

export function useLocaleClient() {
  const [locale, setLocaleState] = useState<Locale>("he");

  useEffect(() => {
    try {
      const fromCookie = (readCookie("mm_locale") || "").toLowerCase();
      const fromHtml = (document.documentElement.lang || "he").toLowerCase();
      const chosen = (ALLOWED as readonly string[]).includes(fromCookie)
        ? (fromCookie as Locale)
        : (fromHtml.split("-")[0] as any as Locale) || "he";
      setLocaleState(chosen);
      document.documentElement.lang = chosen;
      document.documentElement.dir = chosen === "he" ? "rtl" : "ltr";
    } catch {}
  }, []);

  async function setLocale(lc: Locale) {
    try {
      // update cookie server-side (if defined)
      await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: lc }),
        cache: "no-store",
        keepalive: true,
      }).catch(() => {});
    } catch {}
    try {
      // update client cookie and html attributes
      document.cookie = `mm_locale=${lc}; path=/; max-age=31536000`;
      localStorage.setItem("mm_locale_mirror", lc);
      document.documentElement.lang = lc;
      document.documentElement.dir = lc === "he" ? "rtl" : "ltr";
      setLocaleState(lc);
    } finally {
      // reload page to apply new language
      window.location.reload();
    }
  }

  function nextLocale() {
    return NEXT[locale];
  }

  return { locale, setLocale, nextLocale, allowed: ALLOWED };
}
