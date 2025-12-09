import { NextResponse } from "next/server";
import { leaveGroup } from "@/lib/db/fit-repo";
import { getUserIdFromReq } from "@/lib/authz";

export async function POST(_req: Request, ctx: { params: { slug: string } }) {
  try {
    const userId = await getUserIdFromReq();
    const g = await leaveGroup(ctx.params.slug, userId);
    if (!g)
      return NextResponse.json(
        { ok: false, error: "קבוצה לא נמצאה/לא מאושרת" },
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
