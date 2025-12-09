// src/app/api/bookings/[id]/ics/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongo";
import { buildICS } from "@/lib/ics";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const _id = new ObjectId(String(params.id));
  const bookings = await getCollection("bookings");
  const b: any = await bookings.findOne({ _id });
  if (!b)
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 }
    );

  const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "MATY MUSIC";
  const org = process.env.NEXT_PUBLIC_EMAIL || "matymusic770@gmail.com";

  const ics = buildICS({
    uid: `${_id}@matymusic`,
    summary: `${brand} – הופעה`,
    description: `הזמנה ל-${brand} בתאריך ${b.eventDate || ""}${
      b.note ? `\\nהערה: ${b.note}` : ""
    }`,
    date: b.eventDate,
    location: b.location || "",
    organizerEmail: org,
    attendeeEmail: b.email || undefined,
  });

  const fname = `maty-music-${(b.eventDate || "event").replace(/-/g, "")}.ics`;
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Cache-Control": "no-store",
    },
  });
}
