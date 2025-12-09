// src/app/api/admin/fit/groups/route.ts
import { NextResponse } from "next/server";
import { requireAdminAPI } from "@/lib/auth/requireAdmin";
import { getDb } from "@/lib/mongodb";

export async function GET(req: Request) {
  const auth = await requireAdminAPI(req, "admin");
  if (!auth.ok)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const q = searchParams.get("q")?.trim();
  const city = searchParams.get("city")?.trim();

  try {
    const db = await getDb();
    const C = db.collection("fit_groups");

    const filter: any = { status };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ];
    }
    if (city) filter.city = { $regex: city, $options: "i" };

    const items = await C.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
