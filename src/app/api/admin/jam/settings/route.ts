// src/app/api/admin/jam/sessions/route.ts
import { NextResponse } from "next/server";
import { requireAdminAPI } from "@/lib/auth/requireAdmin";
import { getDb } from "@/lib/mongodb";

export async function GET(req: Request) {
  const auth = await requireAdminAPI("admin");
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit") || 50)),
  );

  try {
    const db = await getDb();
    const items = await db
      .collection("jam_sessions")
      .find({}, { projection: {} })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
