import { NextResponse } from "next/server";
import { adminSetGroupStatus } from "@/lib/db/fit-repo";
import { requireAdminAPI } from "@/lib/auth/requireAdmin";

export async function POST(req: Request, ctx: { params: { slug: string } }) {
  const auth = await requireAdminAPI();
  if (!auth.ok)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );

  try {
    const body = await req.json().catch(() => ({}));
    const status = body?.status as
      | "pending"
      | "approved"
      | "rejected"
      | "blocked";
    if (!status)
      return NextResponse.json(
        { ok: false, error: "status required" },
        { status: 400 },
      );
    const g = await adminSetGroupStatus(ctx.params.slug, status);
    if (!g)
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 },
      );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
