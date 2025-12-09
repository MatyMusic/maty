// src/app/(date)/date/upgrade/upgrade-client.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// שנה כאן את המחירים/תיאורים לפי המחירון שקבענו
const PLANS = [
  {
    id: "plus",
    name: "Plus",
    price: "₪29",
    features: ["שליחת הודעות ללא הגבלה", "סינון מתקדם"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₪59",
    features: ["הדגשה בתוצאות", "החזרת החמצות", "כל מה שב-Plus"],
  },
  {
    id: "vip",
    name: "VIP",
    price: "₪99",
    features: ["בולטות מקסימלית", "תעדוף אלגוריתמי", "כל מה שב-Pro"],
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

export default function UpgradeClient() {
  const [busy, setBusy] = React.useState<PlanId | null>(null);
  const router = useRouter();

  async function choose(plan: PlanId) {
    try {
      setBusy(plan);
      const res = await fetch("/api/date/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "שגיאה בביצוע השדרוג");
      }
      router.push("/date/matches");
    } catch (e: any) {
      alert(e?.message || "שגיאה");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-3">
      {PLANS.map((p) => (
        <article
          key={p.id}
          className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 p-6 flex flex-col"
        >
          <header className="mb-4">
            <h2 className="text-xl font-bold">{p.name}</h2>
            <div className="text-3xl font-extrabold mt-1">
              {p.price}
              <span className="text-base font-normal opacity-70"> /חודש</span>
            </div>
          </header>
          <ul className="text-sm space-y-2 mb-6 opacity-90">
            {p.features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <button
            onClick={() => choose(p.id)}
            disabled={!!busy}
            className="mt-auto h-11 rounded-full bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-60"
          >
            {busy === p.id ? "מעבד…" : "בחר/י חבילה"}
          </button>
        </article>
      ))}

      {/* אופציונלי: כפתור דילוג לבדיקות בסביבת פיתוח */}
      {process.env.NEXT_PUBLIC_DATE_SKIP_PAYWALL === "1" && (
        <button
          onClick={() => (window.location.href = "/date/matches")}
          className="md:col-span-3 h-11 rounded-full border mt-2"
          title="דילוג (DEV)"
        >
          דלג (בדיקות)
        </button>
      )}
    </div>
  );
}
