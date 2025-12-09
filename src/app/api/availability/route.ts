export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getCollection } from "@/lib/mongo";

/** GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 * מחזיר { ok, rows, map } כאשר map[date] = 'busy' | 'hold'
 * (hold רק אם לא פג תוקף)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = (searchParams.get("from") || "").slice(0, 10);
  const to = (searchParams.get("to") || "").slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json(
      { ok: false, error: "bad_range" },
      { status: 400 }
    );
  }

  const col = await getCollection("availability");
  const now = new Date();

  const rows = await col
    .find({
      date: { $gte: from, $lte: to },
      $or: [
        { status: "busy" },
        {
          status: "hold",
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
        },
      ],
    })
    .project({ _id: 0, date: 1, status: 1, expiresAt: 1 })
    .toArray();

  const map: Record<string, "busy" | "hold"> = {};
  for (const r of rows) {
    // busy גובר על hold אם בטעות קיימים שניהם
    if (r.status === "busy") map[r.date] = "busy";
    else if (r.status === "hold" && map[r.date] !== "busy")
      map[r.date] = "hold";
  }

  return NextResponse.json({ ok: true, rows, map });
}
