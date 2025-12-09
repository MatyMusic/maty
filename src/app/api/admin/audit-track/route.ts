import { NextRequest, NextResponse } from "next/server";
import AuditEvent from "@/models/AuditEvent";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = (token as any)?.email || "";
  const ip = req.headers.get("x-forwarded-for") || "";
  const ua = req.headers.get("user-agent") || "";
  const body = await req.json().catch(() => ({}));

  try {
    await AuditEvent.create({
      type: "auth.tracked",
      userId: null,
      email,
      ip,
      ua,
      meta: body || {},
    });
  } catch {
    // לא מפילים – ניטור בלבד
  }

  return NextResponse.json({ ok: true });
}
