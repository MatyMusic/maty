import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/mongoose";
import Payment from "@/models/club/Payment"; // ⬅️ דיפולט
import { z } from "zod";

const schema = z.object({
  provider: z.enum(["paybox", "payplus", "paypal"]),
  amount: z.number().positive(),
  currency: z.string().default("ILS"),
  meta: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { provider, amount, currency, meta } = parsed.data;

  const payment = await Payment.create({
    userId: "temp-user", // TODO: session.user.id
    provider,
    amount,
    currency,
    status: "created",
    meta,
  });

  return NextResponse.json({ ok: true, payment });
}
