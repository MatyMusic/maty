"use client";
import { PayPalButtons } from "@paypal/react-paypal-js";

export default function PayPalButton({
  orderId, amountILS, description = "MATY MUSIC – תשלום", onSuccess, onError
}:{
  orderId: string; amountILS: number; description?: string;
  onSuccess?: (captureId: string) => void; onError?: (err:any)=>void;
}) {
  return (
    <PayPalButtons
      style={{ layout: "vertical", shape: "rect", label: "pay" }}
      createOrder={async () => {
        const res = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, amount: amountILS, description }),
        });
        const text = await res.text();
        if (!res.ok) { console.error(text); alert("שגיאה ביצירת הזמנה"); throw new Error(); }
        return JSON.parse(text).id;
      }}
      onApprove={async (data) => {
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paypalOrderId: data.orderID }),
        });
        const text = await res.text();
        if (!res.ok) { console.error(text); alert("שגיאה בלכידת תשלום"); throw new Error(); }
        const j = JSON.parse(text);
        onSuccess?.(j.captureId);
      }}
      onError={(e) => { console.error(e); alert("שגיאה בפתיחת התשלום"); onError?.(e); }}
    />
  );
}
