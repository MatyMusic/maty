"use client";
import PayPalButton from "./PayPalButton";

export default function PaymentMethods({
  orderId, amountILS, description, onPayPalSuccess, onPayPalError
}:{
  orderId: string; amountILS: number; description?: string;
  onPayPalSuccess?: (captureId: string) => void; onPayPalError?: (e:any)=>void;
}) {
  return (
    <div className="grid gap-4">
      <PayPalButton
        orderId={orderId}
        amountILS={amountILS}
        description={description}
        onSuccess={onPayPalSuccess}
        onError={onPayPalError}
      />
    </div>
  );
}
