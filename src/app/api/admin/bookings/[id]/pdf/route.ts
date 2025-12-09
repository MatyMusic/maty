// src/app/api/admin/bookings/[id]/pdf/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildBookingPdfBuffer } from "@/lib/booking-pdf";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session as any)?.user?.role ?? "user";
    if (!session || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    const id = params.id;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "invalid_id" },
        { status: 400 }
      );
    }

    const col = await getCollection("bookings");
    const b = await col.findOne({ _id: new ObjectId(id) });
    if (!b)
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );

    const pdf = await buildBookingPdfBuffer({
      id: String(b._id),
      name: b.name,
      email: b.email,
      phone: b.phone,
      eventDate: b.eventDate,
      amount: b.amount ?? 0,
      note: b.note,
      createdAt: b.createdAt,
    });

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="booking-${String(
          b._id
        )}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[pdf-admin]", e);
    return NextResponse.json(
      { ok: false, error: "server_error", message: e?.message },
      { status: 500 }
    );
  }
}
