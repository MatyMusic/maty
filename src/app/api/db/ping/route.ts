// src/app/api/db/ping/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getDb();
    const r = await db.command({ ping: 1 });
    return NextResponse.json({ ok: true, ping: r.ok === 1 });
  } catch (err: any) {
    // חשוב: לא console.error כאן, כדי לא לזהם את RSC ב-dev
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500, headers: { "X-Error": "db_ping_failed" } }
    );
  }
}
