// src/app/api/admin/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCounts } from "@/lib/clubStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "club";
  if (scope !== "club") {
    return NextResponse.json(
      { ok: false, error: "Unsupported scope" },
      { status: 400 },
    );
  }
  const counts = await getCounts();
  return NextResponse.json({ ok: true, scope, counts });
}
