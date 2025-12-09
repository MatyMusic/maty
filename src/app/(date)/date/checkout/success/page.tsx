"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const qs = useSearchParams();
  const plan = qs.get("plan") || "pro";
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/payments/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const j = await r.json();
        if (!j?.ok) throw new Error(j?.error || "activate failed");
        setOk(true);
      } catch (e: any) {
        setErr(e?.message || "שגיאה בעדכון המנוי");
      }
    })();
  }, [plan]);

  return (
    <main dir="rtl" className="mx-auto max-w-md p-6 text-right">
      <h1 className="text-2xl font-extrabold">תודה! 🎉</h1>
      <p className="mt-2 opacity-80">המנוי עודכן ל־{plan.toUpperCase()}.</p>
      {err && <div className="mt-2 text-red-600">{err}</div>}
      <div className="mt-4 grid gap-2">
        <a
          href="/date/matches"
          className="h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 grid place-items-center"
        >
          חזרה להתאמות
        </a>
        <a
          href="/date/chat/demo"
          className="h-10 rounded-full border grid place-items-center"
        >
          פתח צ׳אט לדוגמה
        </a>
      </div>
      {!ok && !err && (
        <div className="mt-2 text-sm opacity-70">מעדכן מנוי…</div>
      )}
    </main>
  );
}
