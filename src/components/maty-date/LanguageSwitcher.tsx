"use client";
import { useT } from "@/lib/i18n/DateI18nProvider";

export default function LanguageSwitcher() {
  const { lang, setLang } = useT();
  return (
    <div className="inline-flex gap-2 items-center text-sm">
      {(["he", "en", "ru"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 rounded ${
            lang === l ? "border font-bold" : "border-transparent"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
