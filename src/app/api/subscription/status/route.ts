// src/app/api/subscription/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options"; // עדכן נתיב

function isAdminFromSession(session: any): boolean {
  const role = session?.user?.role;
  const flag = session?.user?.isAdmin === true;
  const email = (session?.user?.email || "").toLowerCase();
  const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return !!(
    role === "admin" ||
    role === "superadmin" ||
    flag ||
    (email && allow.includes(email))
  );
}

export async function GET() {
  const session = await getServerSession(authOptions).catch(() => null);
  const isAdmin = isAdminFromSession(session);

  if (isAdmin) {
    return NextResponse.json({
      ok: true,
      active: true,
      level: "pro",
      reason: "admin_bypass",
    });
  }

  // TODO: החזר מצב מנוי אמיתי מה-DB/Stripe
  return NextResponse.json({ ok: true, active: false, level: "free" });
}
