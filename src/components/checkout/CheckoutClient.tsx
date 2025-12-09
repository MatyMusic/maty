"use client";
import PaymentMethods from "@/components/payments/PaymentMethods";

export default function CheckoutClient({ orderId, amountILS }:{
  orderId: string; amountILS: number;
}) {
  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">תשלום</h1>
      <p className="mb-6">סכום לתשלום: {amountILS.toFixed(2)} ₪</p>

      <PaymentMethods
        orderId={orderId}
        amountILS={amountILS}
        description="תשלום הזמנה – MATY MUSIC"
        onPayPalSuccess={(capId) => {
          console.log("PayPal captured:", capId);
          window.location.href = "/checkout/success"; // אחרי שנפתח – נוסיף הפקת חשבונית
        }}
        onPayPalError={(e) => {
          console.error(e);
          alert("שגיאה בתשלום PayPal");
        }}
      />
    </main>
  );
}
