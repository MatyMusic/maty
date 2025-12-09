// src/app/api/admin/jam/stats/route.ts
import { NextResponse } from "next/server";
import { requireAdminAPI } from "@/lib/auth/requireAdmin";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const auth = await requireAdminAPI("admin");
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const db = await getDb();

    const totals = await Promise.all([
      db
        .collection("jam_sessions")
        .countDocuments({})
        .catch(() => 0),
      db
        .collection("jam_sessions")
        .countDocuments({ status: "pending" })
        .catch(() => 0),
      db
        .collection("jam_sessions")
        .countDocuments({ status: "approved" })
        .catch(() => 0),
      db
        .collection("jam_reports")
        .countDocuments({ status: "open" })
        .catch(() => 0),
    ]);

    const [sessions, pending, approved, reportsOpen] = totals;

    return NextResponse.json({
      ok: true,
      sessions,
      pending,
      approved,
      reportsOpen,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
