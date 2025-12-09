import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await auth();
  return NextResponse.json(
    { ok: !!s, user: s?.user || null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
