// src/app/api/flub/payments/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET – החזרת רשימת תשלומים (בשלב ראשון: ריק)
export async function GET() {
  return NextResponse.json({
    ok: true,
    payments: [],
  });
}

// POST – התחלת תשלום / טרנזקציה (placeholder)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  console.log("[FLUB/PAYMENTS] POST body:", body);

  return NextResponse.json(
    {
      ok: true,
      received: body,
    },
    { status: 200 },
  );
}
