// src/app/api/bookings/[id]/pdf/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongo";
import { buildBookingPdfBuffer } from "@/lib/booking-pdf";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
    }
    const col = await getCollection("bookings");
    const b = await col.findOne({ _id: new ObjectId(id) });
    if (!b) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    const buffer = await buildBookingPdfBuffer({
      _id: String(b._id),
      name: b.name,
      email: b.email,
      phone: b.phone,
      eventDate: b.eventDate,
      amount: b.amount ?? 0,
      note: b.note,
      createdAt: b.createdAt,
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="booking-${id}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[pdf-public]", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
