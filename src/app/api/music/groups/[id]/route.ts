import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { groupsCol } from "@/lib/music-groups/db";
import { getSessionUser, isSiteAdmin } from "@/lib/auth/guards";
import { updateGroupSchema } from "@/lib/music-groups/validation";

async function canAdmin(
  group: any,
  user: { id: string; email?: string | null } | null,
) {
  if (!user) return false;
  if (group.ownerId === user.id) return true;
  if ((group.admins || []).includes(user.id)) return true;
  if (await isSiteAdmin(user.email || null)) return true;
  return false;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const col = await groupsCol();
  const item = await col.findOne({ _id: new ObjectId(params.id) });
  if (!item)
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  const col = await groupsCol();
  const item = await col.findOne({ _id: new ObjectId(params.id) });
  if (!item)
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  if (!(await canAdmin(item, user)))
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );

  const body = await req.json().catch(() => ({}));
  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );

  const $set = { ...parsed.data, updatedAt: new Date().toISOString() };
  await col.updateOne({ _id: item._id }, { $set });
  const fresh = await col.findOne({ _id: item._id });
  return NextResponse.json({ ok: true, item: fresh });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  const col = await groupsCol();
  const item = await col.findOne({ _id: new ObjectId(params.id) });
  if (!item)
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );
  const admin = await canAdmin(item, user);
  if (!admin)
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  await col.deleteOne({ _id: item._id });
  return NextResponse.json({ ok: true });
}
