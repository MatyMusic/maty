import { NextRequest, NextResponse } from "next/server";
import Availability from "@/models/Availability";

/**
 * GET /api/availability/range?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * מחזיר:
 * { ok:true, rows:[{date:"YYYY-MM-DD", status:"busy"|"hold"}] }
 *
 * הערה: מחזיר HOLDs רק אם לא פגו (expiresAt=null או בעתיד).
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json(
        { ok: false, error: "missing from/to" },
        { status: 400 }
      );
    }

    const now = new Date();
    const rows = await Availability.find(
      {
        date: { $gte: from, $lte: to },
        $or: [
          { status: "busy" },
          {
            status: "hold",
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
          },
        ],
      },
      { date: 1, status: 1, _id: 0 }
    )
      .sort({ date: 1 })
      .lean();

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 }
    );
  }
}
