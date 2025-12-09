"use client";

type Props = {
  orderId: string;
  amountILS: number;
  description?: string;
};

export default function IsraeliHostedButton({ orderId, amountILS, description = "MATY MUSIC Order" }: Props) {
  const handlePay = () => {
    // החלף לכשיהיה לך ספק: const url = buildTranzilaOrMeshulamUrl({ amountILS, orderId, description, ... });
    const url = `https://example-pay-hosted.com/checkout?amount=${amountILS.toFixed(2)}&orderId=${encodeURIComponent(orderId)}&desc=${encodeURIComponent(description)}&currency=ILS&callback=${encodeURIComponent("https://your-domain.com/checkout/callback")}`;
    window.location.href = url;
  };

  return (
    <button
      onClick={handlePay}
      className="w-full rounded-xl border px-4 py-3 text-base font-medium hover:bg-black hover:text-white transition"
      aria-label="שלם באשראי ישראלי"
    >
      אשראי ישראלי (עמלות בלבד)
    </button>
  );
}
