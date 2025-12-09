// src/app/api/flub/gifts/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET – מחזיר רשימת מתנות (בשלב ראשון ריק)
export async function GET() {
  return NextResponse.json({
    ok: true,
    gifts: [],
  });
}

// POST – יצירת/שליחת מתנה (placeholder)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  console.log("[FLUB/GIFTS] POST body:", body);

  return NextResponse.json(
    {
      ok: true,
      received: body,
    },
    { status: 200 },
  );
}
