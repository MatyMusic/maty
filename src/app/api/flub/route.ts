// src/app/api/me/flags/route.ts
import { isBypassActive } from "@/lib/admin-bypass";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    flags: { adminBypass: isBypassActive() },
  });
}
