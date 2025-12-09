// src/app/api/orders/record/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { orderId, status, payload } = body || {};
  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: "orderId missing" },
      { status: 400 }
    );
  }

  const db = await getDb();
  await db
    .collection("orders")
    .updateOne(
      { orderId },
      {
        $set: { status: status ?? "received", payload, updatedAt: new Date() },
      },
      { upsert: true }
    );

  return NextResponse.json({ ok: true });
}
