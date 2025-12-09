// src/app/api/club/posts/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updatePost } from "@/lib/clubStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json().catch(() => ({}));
    const newStatus = body?.status as "approved" | "rejected";
    if (!newStatus || !["approved", "rejected"].includes(newStatus)) {
      return NextResponse.json(
        { ok: false, error: "Invalid status" },
        { status: 400 },
      );
    }
    const updated = await updatePost(params.id, { status: newStatus });
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 },
    );
  }
}
