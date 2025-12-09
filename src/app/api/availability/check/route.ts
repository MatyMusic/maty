import { NextRequest, NextResponse } from "next/server";
import Availability from "@/models/Availability";
import { toDateKeyUTC } from "@/lib/date-utils";

/**
 * POST /api/availability/check
 * body: { date: "2025-08-30" | ISO date }
 * res : { ok:true, date:"YYYY-MM-DD", available:boolean, reason?: "busy"|"hold" }
 */
export async function POST(req: NextRequest) {
  try {
    const { date } = await req.json().catch(() => ({}));
    if (!date)
      return NextResponse.json(
        { ok: false, error: "missing date" },
        { status: 400 }
      );

    const key = toDateKeyUTC(date);

    // תאריך תפוס אם יש אחת מהרשומות:
    // - busy באותו יום
    // - hold באותו יום שלא פג (expiresAt > now)
    const now = new Date();
    const hit = await Availability.findOne({
      date: key,
      $or: [
        { status: "busy" },
        {
          status: "hold",
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        },
      ],
    }).lean();

    if (hit) {
      return NextResponse.json({
        ok: true,
        date: key,
        available: false,
        reason: hit.status,
      });
    }
    return NextResponse.json({ ok: true, date: key, available: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 }
    );
  }
}
