export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getCollection } from "@/lib/mongo";
import { ObjectId } from "mongodb";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  try {
    const bookings = await getCollection("bookings");
    const _id = new ObjectId(params.id);
    const b: any = await bookings.findOne({ _id });
    if (!b)
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );

    const amount = Number(b.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "no_amount" },
        { status: 400 }
      );
    }

    const SANDBOX = String(process.env.CARDCOM_SANDBOX ?? "true") === "true";
    const TERMINAL = process.env.CARDCOM_TERMINAL_NUMBER;
    const USER = process.env.CARDCOM_USER;
    const KEY = process.env.CARDCOM_API_KEY;

    const payload = {
      amount: Math.round(amount * 100), // אגורות
      currency: "ILS",
      description: `תשלום עבור הזמנה ${String(_id)} — MATY MUSIC`,
      // אפשר להרחיב כאן שדות בהתאם ל־API האמיתי של Cardcom
      returnUrl: `${origin}/checkout/success`,
      cancelUrl: `${origin}/checkout/cancel`,
      customer: { name: b.name || "", email: b.email || "" },
    };

    // אם אין מפתחות או SANDBOX = true — נחזיר דמו
    if (!TERMINAL || !USER || !KEY || SANDBOX) {
      return NextResponse.json({
        ok: true,
        sandbox: true,
        approveUrl: `${origin}/checkout/preview?ref=${_id}&amount=${amount.toFixed(
          2
        )}`,
        payload,
        note: "Cardcom במסוף דמו/ללא מפתחות — approveUrl הוא קישור תצוגה מקדימה בלבד.",
      });
    }

    // TODO: מימוש אמיתי מול Cardcom (כשהמסוף מוכן)
    return NextResponse.json(
      { ok: false, error: "not_implemented" },
      { status: 501 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "server_error", message: e?.message || "" },
      { status: 500 }
    );
  }
}
