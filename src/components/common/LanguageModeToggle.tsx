"use client";

import * as React from "react";
import { useLocaleClient } from "./useLocaleClient";

const NEXT: Record<"he" | "en" | "fr" | "ru", "en" | "fr" | "ru" | "he"> = {
  he: "en",
  en: "fr",
  fr: "ru",
  ru: "he",
};

const LABEL: Record<"he" | "en" | "fr" | "ru", string> = {
  he: "HE",
  en: "EN",
  fr: "FR",
  ru: "RU",
};

export default function LanguageModeToggle({
  className = "",
  title = "החלף שפה",
}: {
  className?: string;
  title?: string;
}) {
  const { locale, setLocale } = useLocaleClient();
  const [busy, setBusy] = React.useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      await setLocale(NEXT[locale]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={
        "inline-flex h-9 items-center justify-center rounded-full border px-3 text-xs font-bold " +
        "border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 " +
        "hover:bg-white/95 dark:hover:bg-neutral-800 transition " +
        (className || "")
      }
      disabled={busy}
    >
      {busy ? "…" : LABEL[locale]}
    </button>
  );
}
