// src/app/api/admin/badges/route.ts
import { requireAdminAPI } from "@/lib/auth/requireAdmin";
import { getDb } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminAPI("admin");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const db = await getDb();

    const fitGroupsPending = await db
      .collection("fit_groups")
      .countDocuments({ status: "pending" })
      .catch(() => 0);

    const jamSessionsPending = await db
      .collection("jam_sessions")
      .countDocuments({ status: "pending" })
      .catch(() => 0);

    const jamReportsOpen = await db
      .collection("jam_reports")
      .countDocuments({ status: "open" })
      .catch(() => 0);

    return NextResponse.json({
      ok: true,
      badges: {
        music: { libraryPending: 0 },
        club: { postApprovals: 0, reportsOpen: 0 },
        date: { profileReports: 0 },
        fit: { groupApprovals: fitGroupsPending },
        jam: {
          sessionApprovals: jamSessionsPending,
          reportsOpen: jamReportsOpen,
        },
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
