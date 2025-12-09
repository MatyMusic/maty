"use client";

import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

type Props = { orderId: string; amountILS: number };

export default function CheckoutSmoke({ orderId, amountILS }: Props) {
  const [{ loadingStatus, options, isRejected }] = usePayPalScriptReducer() as any;

  return (
    <main className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-3">תשלום</h1>
      <p className="mb-6">סכום לתשלום: {amountILS.toFixed(2)} ₪</p>

      {/* פס דיבאג קטן */}
      <div className="mb-4 text-xs text-left p-3 rounded-xl border border-slate-300 dark:border-white/10">
        <div>SDK status: {loadingStatus}</div>
        <div>currency: {(options as any)?.currency ?? "n/a"}</div>
      </div>

      {isRejected && (
        <div className="p-3 rounded bg-red-600 text-white mb-4">
          טעינת PayPal SDK נכשלה. בדוק Client ID / currency והפעל שרת מחדש.
        </div>
      )}

      <PayPalButtons
        style={{ layout: "vertical", shape: "rect", label: "pay" }}
        createOrder={async () => {
          const res = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              amount: amountILS,
              description: "תשלום הזמנה – MATY MUSIC",
            }),
          });
          const t = await res.text();
          if (!res.ok) { console.error("create-order:", t); alert("שגיאה ביצירת הזמנה: " + t); throw new Error(); }
          return JSON.parse(t).id;
        }}
        onApprove={async (data) => {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paypalOrderId: data.orderID }),
          });
          const t = await res.text();
          if (!res.ok) { console.error("capture-order:", t); alert("שגיאה בלכידת תשלום: " + t); throw new Error(); }
          const j = JSON.parse(t);
          alert("הצליח! captureId: " + j.captureId);
        }}
        onError={(e) => { console.error("PayPal onError", e); alert("שגיאה בפתיחת התשלום"); }}
      />
    </main>
  );
}
