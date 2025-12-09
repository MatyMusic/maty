// src/app/api/date/profile/[userId]/photos/reorder/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { connectDB } from "@/lib/db";
import DateProfile from "@/models/DateProfile";

const j = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });

export async function PUT(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await connectDB();

    const session = await getServerSession(authConfig);
    const email = session?.user?.email;
    if (!email) return j({ ok: false, error: "unauthorized" }, { status: 401 });

    const { order } = await req.json().catch(() => ({}));
    if (
      !Array.isArray(order) ||
      order.some((u: any) => typeof u !== "string")
    ) {
      return j({ ok: false, error: "invalid_order" }, { status: 400 });
    }

    const doc = await DateProfile.findOne({ userId: params.userId }).lean();
    if (!doc)
      return j({ ok: false, error: "profile_not_found" }, { status: 404 });

    // ודא שכל ה־urls שהתקבלו קיימים בגלריה הנוכחית
    const cur: string[] = Array.isArray(doc.photos) ? doc.photos : [];
    const set = new Set(cur);
    const allKnown = order.every((u: string) => set.has(u));
    if (!allKnown)
      return j({ ok: false, error: "unknown_url" }, { status: 400 });

    // שמירת סדר חדש (ללא שינוי/מחיקה של תמונות)
    const next = order.slice();
    await DateProfile.updateOne(
      { userId: params.userId },
      { $set: { photos: next, updatedAt: new Date() } }
    );

    return j({ ok: true, photos: next });
  } catch (e: any) {
    return j(
      { ok: false, error: e?.message || "reorder_failed" },
      { status: 500 }
    );
  }
}
