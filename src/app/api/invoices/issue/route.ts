import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Item = { title: string; qty: number; unitPrice: number };

export async function POST(req: Request) {
  const { items = [], customer } = (await req.json()) as {
    items: Item[];
    customer?: { name?: string; email?: string };
  };

  const subtotal = items.reduce(
    (sum: number, it: Item) => sum + it.qty * it.unitPrice,
    0
  );
  const vatRate = 0; // אם תרצה מע״מ: 0.17
  const vat = +(subtotal * vatRate).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);

  return NextResponse.json({
    ok: true,
    invoice: {
      number: `MM-${Date.now()}`,
      customer: customer ?? {},
      items,
      subtotal,
      vat,
      total,
      issuedAt: new Date().toISOString(),
    },
  });
}
