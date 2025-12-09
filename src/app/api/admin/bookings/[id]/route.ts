export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getCollection } from "@/lib/mongo";
import { ObjectId } from "mongodb";

type BookingStatus =
  | "pending"
  | "approved"
  | "declined"
  | "cancelled"
  | "paid"
  | "hold";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coll = await getCollection("bookings");
    const _id = new ObjectId(params.id);
    const one = await coll.findOne({ _id });
    if (!one)
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    return NextResponse.json({
      ok: true,
      item: { ...one, _id: String(one._id) },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  try {
    const _id = new ObjectId(params.id);
    const body = await req.json().catch(() => ({} as any));

    const set: Record<string, any> = {};
    const now = new Date();

    if (typeof body.amount === "number") set.amount = +body.amount;
    if (typeof body.note === "string") set.note = body.note.trim();

    // שינוי סטטוס
    const valid: BookingStatus[] = [
      "pending",
      "approved",
      "declined",
      "cancelled",
      "paid",
      "hold",
    ];
    if (body.status && valid.includes(body.status)) {
      set.status = body.status as BookingStatus;
      if (body.status === "approved") set.approvedAt = now.toISOString();
      if (body.status === "declined") set.declinedAt = now.toISOString();
      if (body.status === "cancelled") set.cancelledAt = now.toISOString();
      if (body.status === "paid") set.paidAt = now.toISOString();
      if (body.status === "hold") set.holdSetAt = now.toISOString();
    }

    // עדכון במסד
    const coll = await getCollection("bookings");
    const res = await coll.updateOne({ _id }, { $set: set });

    // אופציונלי: סנכרון לוח זמינות (busy/hold)
    if (
      body.syncAvailability &&
      (body.status === "approved" || body.status === "hold")
    ) {
      const after = await coll.findOne({ _id });
      const eventDate = (after as any)?.eventDate as string | undefined;
      if (eventDate) {
        const availability = await getCollection("availability");
        if (body.status === "approved") {
          await availability.updateOne(
            { date: eventDate, status: "busy" },
            {
              $setOnInsert: {
                date: eventDate,
                status: "busy",
                note: `Booking ${String(_id)}`,
                createdAt: now,
              },
            },
            { upsert: true }
          );
        } else if (body.status === "hold") {
          const holdDays = Math.max(
            1,
            Math.min(14, Number(body.holdDays ?? 7))
          );
          const expiresAt = new Date(
            Date.now() + holdDays * 24 * 60 * 60 * 1000
          );
          await availability.updateOne(
            { date: eventDate, status: "hold" },
            {
              $set: {
                date: eventDate,
                status: "hold",
                note: `Hold ${String(_id)}`,
                expiresAt,
                updatedAt: now,
              },
              $setOnInsert: { createdAt: now },
            },
            { upsert: true }
          );
        }
      }
    }

    return NextResponse.json({ ok: true, modified: res.modifiedCount });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "bad_request", message: e?.message || "" },
      { status: 400 }
    );
  }
}
