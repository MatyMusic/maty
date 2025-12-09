// src/app/(date)/date/checkout/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PLANS } from "@/lib/payments/plans";

export default function CheckoutPage() {
  const qs = useSearchParams();
  const router = useRouter();
  const plan = (qs.get("plan") || "pro") as keyof typeof PLANS;
  const feature = qs.get("feature") || "";
  const src = qs.get("src") || "upgrade";
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const r = await fetch("/api/payments/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, feature, src }),
        });
        const j = await r.json();
        if (!j?.ok) throw new Error(j?.error || "create-session failed");
        setRedirectUrl(j.redirectUrl);
        // בדמו נשארים כאן ומציגים כפתורי המשך; כשיהיה ספק אמיתי: router.push(j.redirectUrl)
      } catch (e: any) {
        setError(e?.message || "שגיאה בהכנת התשלום");
      }
    })();
  }, [plan, feature, src, router]);

  const p = PLANS[plan];

  return (
    <main dir="rtl" className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-extrabold">תשלום מאובטח</h1>
      <div className="mt-2 rounded-2xl border p-4 bg-white/80 dark:bg-neutral-900/70 border-black/10 dark:border-white/10">
        <div className="text-lg font-bold">{p.name}</div>
        <div className="opacity-80 text-sm">₪{p.priceILS}/חודש</div>
        <ul className="mt-2 text-sm list-disc ps-5 opacity-90">
          {p.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        {!error && !redirectUrl && (
          <div className="mt-4 text-sm opacity-70">מכין תשלום…</div>
        )}

        {/* מצב דמו: סימולציית הצלחה/ביטול */}
        {redirectUrl && (
          <div className="mt-4 grid gap-2">
            <a
              href={`/date/checkout/success?plan=${plan}`}
              className="h-10 rounded-full bg-emerald-600 text-white grid place-items-center"
            >
              סימולציית הצלחה
            </a>
            <a
              href={`/date/checkout/cancel?plan=${plan}`}
              className="h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 grid place-items-center"
            >
              ביטול
            </a>
            <a
              href={redirectUrl}
              className="h-10 rounded-full bg-violet-600 text-white grid place-items-center"
            >
              מעבר לקישור התשלום (דמו)
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
