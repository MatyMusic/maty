// src/app/api/admin/bypass/debug/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const hashPresent = !!process.env.ADMIN_BYPASS_HASH;
  const secretPresent = !!process.env.BYPASS_SECRET;

  return NextResponse.json({
    ok: true,
    env: {
      ADMIN_BYPASS_KEY: !!process.env.ADMIN_BYPASS_KEY ? "present" : "missing",
      ADMIN_BYPASS_HASH: hashPresent ? "present" : "missing",
      BYPASS_SECRET: secretPresent ? "present" : "missing",
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}
