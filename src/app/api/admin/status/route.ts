// src/app/api/admin/status/route.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isBypassActive } from "@/lib/admin-bypass";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const role = (token as any)?.role || null;
    const userId = (token as any)?.sub || null;
    const bypass = await isBypassActive();

    return NextResponse.json(
      {
        ok: true,
        auth: Boolean(token),
        role,
        userId,
        bypass,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e: any) {
    // לא זורקים ריק — תמיד JSON
    return NextResponse.json(
      { ok: false, error: e?.message || "status_failed" },
      { status: 500 },
    );
  }
}
