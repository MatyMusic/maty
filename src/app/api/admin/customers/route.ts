export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/mongo";

function intOr(v: string | null, d: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : d;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session as any)?.user?.role ?? "user";
    if (!session || !["admin", "superadmin"].includes(role)) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, intOr(searchParams.get("page"), 1));
    const pageSize = Math.min(
      100,
      Math.max(1, intOr(searchParams.get("pageSize"), 20))
    );

    const bookingsCol = await getCollection("bookings");
    let customersCol: Awaited<ReturnType<typeof getCollection>> | null = null;
    try {
      customersCol = await getCollection("customers");
    } catch {
      customersCol = null;
    }

    let rows: any[] = [];
    let total = 0;

    if (customersCol) {
      const filter: any = {};
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
        ];
      }
      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
        if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
      }
      total = await customersCol.countDocuments(filter);
      rows = await customersCol
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();
    } else {
      const match: any = {};
      if (q) {
        match.$or = [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
        ];
      }
      if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
        if (to) match.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
      }

      const agg = await bookingsCol
        .aggregate([
          { $match: match },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$email",
              name: { $first: "$name" },
              email: { $first: "$email" },
              phone: { $first: "$phone" },
              createdAt: { $first: "$createdAt" },
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $facet: {
              rows: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
              meta: [{ $count: "total" }],
            },
          },
        ])
        .toArray();

      rows = agg[0]?.rows ?? [];
      total = agg[0]?.meta?.[0]?.total ?? 0;
    }

    return NextResponse.json({ ok: true, rows, total, page, pageSize });
  } catch (e: any) {
    console.error("[admin/customers]", e);
    return NextResponse.json(
      { ok: false, error: "server_error", message: e?.message },
      { status: 500 }
    );
  }
}
