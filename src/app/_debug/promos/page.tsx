// דף מלא — בדיקה ידנית
"use client";
import * as React from "react";
import { useI18n } from "@/components/common/LocaleProvider";

export default function DebugPromosPage() {
  const { locale, setLocale } = useI18n();
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch(`/api/club/promotions?active=1&limit=10&locale=${locale}`, {
      cache: "no-store",
      headers: { "x-app-locale": locale },
    })
      .then((r) => r.json())
      .then((j) => setItems(j.items || []))
      .catch(() => setItems([]));
  }, [locale]);

  return (
    <main dir="rtl" className="container-section py-6 space-y-4">
      <div className="flex items-center gap-3">
        <span>Locale:</span>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="he">he</option>
          <option value="en">en</option>
          <option value="ru">ru</option>
          <option value="fr">fr</option>
          <option value="es">es</option>
        </select>
      </div>

      <pre className="bg-black/5 dark:bg-white/5 p-3 rounded">
        {JSON.stringify(items, null, 2)}
      </pre>
    </main>
  );
}
