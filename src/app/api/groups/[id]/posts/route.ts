// src/app/api/groups/[id]/posts/route.ts
import { NextResponse } from "next/server";
import {
  addMember,
  addPost,
  getGroupById,
  listPosts,
} from "@/lib/db/groups-repo";
import { getSessionSafe, isAdminFromSession } from "@/lib/authz";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: פוסטים (אדמין תמיד יכול; ציבור יראה רק בקבוצות approved) */
export async function GET(_: Request, ctx: { params: { id: string } }) {
  const group = await getGroupById(ctx.params.id);
  if (!group)
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );

  // הגנה בסיסית: אם לא approved — רק אדמין/בעלים דרך דשבורד ייגשו (לצד לקוח לא נחשוף).
  if (group.status !== "approved") {
    const session = await getSessionSafe();
    const isAdmin = isAdminFromSession(session);
    const uid =
      (session?.user as any)?.id || (session?.user as any)?.userId || "";
    if (!isAdmin && uid !== group.ownerId) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }
  }

  const items = await listPosts(ctx.params.id);
  return NextResponse.json({ ok: true, items });
}

/** POST: יצירת פוסט חדש + הצטרפות אוטומטית כחבר (אם לא קיים) */
export async function POST(req: Request, ctx: { params: { id: string } }) {
  const session = await getSessionSafe();
  const userId =
    (session?.user as any)?.id || (session?.user as any)?.userId || null;
  if (!userId)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );

  const group = await getGroupById(ctx.params.id);
  if (!group)
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  if (group.status !== "approved")
    return NextResponse.json(
      { ok: false, error: "group_not_approved" },
      { status: 403 },
    );

  const body = await req.json().catch(() => ({}));
  const content = (body?.content || "").trim();
  if (!content)
    return NextResponse.json(
      { ok: false, error: "missing_content" },
      { status: 400 },
    );

  // הצטרפות שקטה כחבר
  await addMember(
    ctx.params.id,
    userId,
    userId === group.ownerId ? "owner" : "member",
  );

  const post = await addPost(ctx.params.id, userId, content);
  return NextResponse.json({ ok: true, post });
}
