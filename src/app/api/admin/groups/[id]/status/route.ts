import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { groupsCol } from "@/lib/music-groups/db";
import { statusChangeSchema } from "@/lib/music-groups/validation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { isSiteAdmin } from "@/lib/auth/guards";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authConfig);
  const email = (session?.user?.email || "").toLowerCase();
  const uid = session?.user?.id || null;
  if (!uid || !(await isSiteAdmin(email))) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = statusChangeSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );

  const col = await groupsCol();
  const _id = new ObjectId(params.id);
  const item = await col.findOne({ _id });
  if (!item)
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );

  const now = new Date().toISOString();
  await col.updateOne(
    { _id },
    {
      $set: {
        status: parsed.data.status,
        reviewNote: parsed.data.note || null,
        reviewedBy: uid,
        reviewedAt: now,
        updatedAt: now,
      },
    },
  );

  const fresh = await col.findOne({ _id });
  return NextResponse.json({ ok: true, item: fresh });
}
