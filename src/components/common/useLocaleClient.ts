"use client";

import * as React from "react";

type Locale = "he" | "en" | "fr" | "ru";
const ALLOWED: Locale[] = ["he", "en", "fr", "ru"];

export function useLocaleClient() {
  const [current, setCurrent] = React.useState<Locale>(() => {
    if (typeof document !== "undefined") {
      const lang = (document.documentElement.lang || "he").toLowerCase();
      return (ALLOWED.includes(lang as Locale) ? lang : "he") as Locale;
    }
    return "he";
  });

  async function setLocale(lc: Locale, reload: boolean = true) {
    const r = await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: lc }),
    });
    if (r.ok) {
      setCurrent(lc);
      if (reload) window.location.reload();
    } else {
      console.error("Failed to set locale", await r.text());
      alert("שינוי שפה נכשל.");
    }
  }

  return { locale: current, setLocale, allowed: ALLOWED as readonly Locale[] };
}
