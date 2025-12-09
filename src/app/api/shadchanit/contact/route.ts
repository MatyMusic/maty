// src/app/api/shadchanit/contact/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, phone, about } = body || {};
    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 }
      );
    }

    // TODO: שליחת מייל אמיתי ל־Moshiachbeitar@gmail.com (Nodemailer/Sendgrid)
    console.log("[shadchanit] new lead:", { name, phone, about });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[shadchanit/contact] error:", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
