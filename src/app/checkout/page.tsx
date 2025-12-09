import CheckoutRedirectClient from "@/components/checkout/CheckoutRedirectClient";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function CheckoutPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const orderIdParam = Array.isArray(searchParams.orderId) ? searchParams.orderId[0] : searchParams.orderId;
  const amountParam = Array.isArray(searchParams.amount) ? searchParams.amount[0] : searchParams.amount;

  const orderId = orderIdParam && orderIdParam.trim() ? orderIdParam : `MATY-${Date.now()}`;
  const amountRaw = amountParam ? String(amountParam).replace(/[^\d.]/g, "") : "1";
  const amountILS = Math.max(1, Math.floor(Number(amountRaw) || 1));

  return (
    <section className="checkout section-padding">
      <div className="container-section">
        <CheckoutRedirectClient orderId={orderId} amountILS={amountILS} />
      </div>
    </section>
  );
}
