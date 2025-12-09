import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  await requireAdmin();
  const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
  const rows = await db
    .collection("date_profiles")
    .find({}, { projection: { _id: 0 } })
    .limit(5000)
    .toArray();

  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: any) => {
    if (v == null) return "";
    const s = String(Array.isArray(v) ? v.join("|") : v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => esc((r as any)[k])).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="date_profiles.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
