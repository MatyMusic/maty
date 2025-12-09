export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/mongo";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session as any)?.user?.role ?? "user";
    if (!session || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "";
    const from = url.searchParams.get("from")?.trim() || "";
    const to = url.searchParams.get("to")?.trim() || "";
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("pageSize") || 20))
    );

    const query: any = {};
    if (status) query.status = status;

    // eventDate נשמר כ־YYYY-MM-DD (string) → אפשר טווח לקסיקוגרפי
    if (from || to) {
      query.eventDate = {};
      if (from) query.eventDate.$gte = from;
      if (to) query.eventDate.$lte = to;
    }

    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    const col = await getCollection("bookings");
    const total = await col.countDocuments(query);
    const rows = await col
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return NextResponse.json({ ok: true, rows, total, page, pageSize });
  } catch (e: any) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[admin/bookings] dev warn:", e?.message || e);
    }
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
