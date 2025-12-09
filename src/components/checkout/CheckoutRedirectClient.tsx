"use client";
import { useState } from "react";

export default function CheckoutRedirectClient({
  orderId, amountILS,
}: { orderId: string; amountILS: number; }) {
  const [loading, setLoading] = useState(false);

  async function pay() {
    try {
      setLoading(true);
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount: amountILS, description: "תשלום הזמנה – MATY MUSIC" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.approveUrl) throw new Error(data?.error?.message || "create-order failed");
      window.location.href = data.approveUrl; // מעבר ל-PayPal
    } catch (e:any) {
      alert("שגיאה בפתיחת PayPal: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-3">תשלום</h1>

      <p className="mb-1">סכום לתשלום: <b>{amountILS.toFixed(2)} ₪</b></p>
      <p className="mb-6 text-xs text-slate-500">
        לאחר התשלום יישלח אליך אימייל אישור עם כל הפרטים והקובץ (PDF).
        אם לא הזנת אימייל בטופס הקודם—ניצור קשר להשלים אותו.
      </p>

      <button onClick={pay} className="btn bg-brand text-white border-0 hover:opacity-90" disabled={loading}>
        {loading ? "פותח..." : "שלם עם PayPal"}
      </button>
    </main>
  );
}
