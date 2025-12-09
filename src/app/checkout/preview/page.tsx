"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

function shekels(n: number) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);
}

export default function PreviewCheckoutPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const bookingId = sp.get("ref") || "";
  const amountStr = sp.get("amount") || "0";
  const amount = Math.max(0, Number(amountStr || 0));

  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });
  const [loading, setLoading] = useState(false);
  const brand = useMemo(() => process.env.NEXT_PUBLIC_BRAND_NAME || "MATY MUSIC", []);

  async function onPay() {
    if (!bookingId) return alert("חסר מזהה הזמנה (ref)");
    if (!amount || !Number.isFinite(amount)) return alert("סכום לא תקין");

    setLoading(true);
    try {
      // Sandbox only: קורא ל-API שמסמן את ההזמנה כשולמה
      const r = await fetch("/api/pay/mock-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, amount }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        console.error("mock-capture failed:", j);
        alert(j?.error || "תשלום דמו נכשל");
        setLoading(false);
        return;
      }
      router.replace(`/checkout/success?ref=${encodeURIComponent(bookingId)}`);
    } catch (e: any) {
      alert(e?.message || "שגיאה לא צפויה");
      setLoading(false);
    }
  }

  function onCancel() {
    router.replace(`/checkout/cancel?ref=${encodeURIComponent(bookingId)}`);
  }

  return (
    <main className="container-section section-padding max-w-2xl mx-auto" dir="rtl">
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">{brand} — תשלום דמו</h1>
          <div className="text-xl font-bold">{shekels(amount)}</div>
        </div>

        <p className="text-sm opacity-80">
          זהו מסך תשלום <b>Sandbox</b> לצורכי בדיקה בלבד. אין חיוב אמיתי בכרטיס. בלחיצה על “שלם עכשיו”
          ההזמנה תסומן “שולמה” במערכת.
        </p>

        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm">מספר כרטיס</span>
            <input
              className="input border px-3 py-2 rounded"
              placeholder="4111 1111 1111 1111"
              inputMode="numeric"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm">תוקף</span>
              <input
                className="input border px-3 py-2 rounded"
                placeholder="MM/YY"
                value={card.exp}
                onChange={(e) => setCard({ ...card, exp: e.target.value })}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">CVV</span>
              <input
                className="input border px-3 py-2 rounded"
                placeholder="123"
                inputMode="numeric"
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value })}
              />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-sm">שם בעל הכרטיס</span>
            <input
              className="input border px-3 py-2 rounded"
              placeholder="שם מלא"
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button className="btn px-4 py-2" onClick={onCancel} disabled={loading}>
            ביטול
          </button>
          <button
            className="btn bg-brand text-white border-0 px-4 py-2 disabled:opacity-60"
            onClick={onPay}
            disabled={loading}
          >
            {loading ? "מעבד תשלום…" : "שלם עכשיו (דמו)"}
          </button>
        </div>

        <div className="text-[12px] opacity-60">
          מזהה הזמנה: <code>{bookingId || "—"}</code>
        </div>
      </div>
    </main>
  );
}
