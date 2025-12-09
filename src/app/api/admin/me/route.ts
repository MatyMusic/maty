// src/app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { requireAdminAPI } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const auth = await requireAdminAPI("admin");
  if (!auth.ok) {
    return NextResponse.json({ ok: false, admin: false }, { status: 200 });
  }
  return NextResponse.json({
    ok: true,
    admin: true,
    role: auth.role,
  });
}
