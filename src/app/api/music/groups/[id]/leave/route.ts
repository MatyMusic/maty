import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { groupsCol } from "@/lib/music-groups/db";
import { requireUser } from "@/lib/auth/guards";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await requireUser();
  const col = await groupsCol();
  const item = await col.findOne({ _id: new ObjectId(params.id) });
  if (!item)
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 },
    );

  // בעלים לא יכול לצאת (מונעים יתמות)
  if (item.ownerId === user.id) {
    return NextResponse.json(
      { ok: false, error: "Owner cannot leave. Transfer ownership first." },
      { status: 409 },
    );
  }
  if (!(item.members || []).includes(user.id)) {
    return NextResponse.json({ ok: true, item });
  }
  await col.updateOne(
    { _id: item._id },
    {
      $pull: { members: user.id },
      $inc: { membersCount: -1 },
      $set: { updatedAt: new Date().toISOString() },
    },
  );
  const fresh = await col.findOne({ _id: item._id });
  return NextResponse.json({ ok: true, item: fresh });
}
