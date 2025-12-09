import { NextRequest, NextResponse } from "next/server";
import AuditEvent from "@/models/AuditEvent";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = (token as any)?.email || "";
  const ip = req.headers.get("x-forwarded-for") || "";
  const ua = req.headers.get("user-agent") || "";
  const body = await req.json().catch(() => ({}));

  await AuditEvent.create({
    type: "auth.tracked",
    userId: null,
    email,
    ip,
    ua,
    meta: body || {},
  });

  return NextResponse.json({ ok: true });
}
