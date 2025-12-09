export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongo";
import { buildBookingPDF } from "@/lib/pdf";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const bookings = await getCollection("bookings");
    const row = await bookings.findOne({ _id: new ObjectId(id) });
    if (!row)
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );

    const pdf = await buildBookingPDF({
      bookingId: String(row._id),
      name: row.name || "",
      email: row.email || "",
      phone: row.phone || "",
      eventDate: row.eventDate,
      amount: row.amount || 0,
      note: row.note || "",
    });

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="MATY-MUSIC-${row._id}.pdf"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (e) {
    console.error("[receipt.pdf] error:", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
