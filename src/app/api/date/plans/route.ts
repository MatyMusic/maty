// src/app/api/date/plans/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPlanCatalog } from "@/lib/date/plans";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  return NextResponse.json(
    { ok: true, plans: getPlanCatalog() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
