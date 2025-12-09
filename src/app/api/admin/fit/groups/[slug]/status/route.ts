import { NextResponse } from "next/server";
import { requireAdminAPI } from "@/lib/auth/requireAdmin";
import { getDb } from "@/lib/mongodb";

type NextCtx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, ctx: NextCtx) {
  const auth = await requireAdminAPI(req, "admin");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  // Dynamic params must be awaited
  const { slug } = await ctx.params;
  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "missing_slug" },
      { status: 400 },
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const status = String(body?.status || "").trim();
  if (!["approved", "rejected", "blocked"].includes(status)) {
    return NextResponse.json(
      { ok: false, error: "invalid_status" },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const C = db.collection("fit_groups");
    const res = await C.updateOne(
      { slug },
      { $set: { status, updatedAt: new Date().toISOString() } },
    );
    if (!res.matchedCount) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
