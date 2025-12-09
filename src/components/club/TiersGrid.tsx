// src/components/club/TiersGrid.tsx
"use client";

import { useState } from "react";

type Tier = {
  id: "guest" | "club" | "allaccess" | "vip";
  name: string;
  price: string;
  priceId?: string; // Stripe price id (לחיוב)
  features: string[];
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "guest",
    name: "Guest",
    price: "חינם",
    features: ["שמירת פלייליסטים", "לייקים לניגונים", "כניסה לאזור הקהילה"],
  },
  {
    id: "club",
    name: "Club",
    price: "₪19/חודש",
    priceId: "price_123_club_monthly", // ← החלף ב-Stripe price שלך
    features: ["פלייליסטים בלעדיים", "קדימות לכרטיסים", "5% הנחה לאירועים"],
    highlight: true,
  },
  {
    id: "allaccess",
    name: "All Access",
    price: "₪39/חודש",
    priceId: "price_123_allaccess_monthly",
    features: ["בקשות ניגון מועדפות", "תוכן מוקדם", "10% הנחה לאירועים"],
  },
  {
    id: "vip",
    name: "Backstage VIP",
    price: "₪99/חודש",
    priceId: "price_123_vip_monthly",
    features: ["מאחורי הקלעים", "הצבעה לסט-ליסט", "20% הנחה + מסגרת יוקרתית"],
  },
];

export default function TiersGrid() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const startCheckout = async (priceId?: string) => {
    if (!priceId) return;
    try {
      setLoadingId(priceId);
      const r = await fetch(
        `/api/club/checkout?priceId=${encodeURIComponent(priceId)}`,
        {
          method: "POST",
        }
      );
      if (!r.ok) throw new Error("Checkout failed");
      const j = await r.json();
      if (j?.url) {
        window.location.href = j.url as string;
      }
    } catch (e) {
      console.error(e);
      alert("שגיאה בפתיחת התשלום. נסו שוב.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div
      dir="rtl"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      {TIERS.map((t) => (
        <div
          key={t.id}
          className={[
            "rounded-2xl border p-5 bg-white/80 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 shadow-sm text-right",
            t.highlight
              ? "ring-2 ring-violet-400/60 dark:ring-violet-600/50"
              : "",
          ].join(" ")}
        >
          <div className="text-lg font-extrabold tracking-tight">{t.name}</div>
          <div className="mt-1 text-sm opacity-80">{t.price}</div>

          <ul className="mt-4 text-[15px] leading-7 opacity-90 list-disc pr-4">
            {t.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>

          <div className="mt-5">
            {t.priceId ? (
              <button
                onClick={() => startCheckout(t.priceId)}
                disabled={loadingId === t.priceId}
                className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 disabled:opacity-60"
              >
                {loadingId === t.priceId ? "פותח תשלום…" : "הצטרפות"}
              </button>
            ) : (
              <a
                href="/auth/register"
                className="w-full inline-flex h-10 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 hover:bg-white dark:hover:bg-neutral-800 font-medium"
              >
                הצטרפות חינם
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
