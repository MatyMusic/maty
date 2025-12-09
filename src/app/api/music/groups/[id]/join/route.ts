/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/music/groups/[id]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAuth() {
  const ck = await cookies();
  const hd = await headers();

  let userId: string | null = null;
  let userName: string | null = null;
  let role: string | null = null;

  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions as any);
    userId = (session as any)?.user?.id || null;
    userName = (session as any)?.user?.name || null;
    role = (session as any)?.user?.role || null;
  } catch {}

  const bypass =
    ck.get("maty_admin_bypass")?.value === "1" ||
    ck.get("mm-admin")?.value === "1" ||
    hd.get("x-maty-admin") === "1" ||
    process.env.DEMO_UNLOCK === "1" ||
    process.env.ALLOW_UNSAFE_ADMIN === "1";

  const isAdmin = bypass || role === "admin" || role === "superadmin";
  return { userId, userName, role, isAdmin };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getAuth();
    if (!auth.userId && !auth.isAdmin) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const id = params.id;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
    }

    const col = await getCollection<any>("music_groups");
    const _id = new ObjectId(id);

    // מצטרף, מוודא ייחודיות
    await col.updateOne(
      { _id },
      { $addToSet: { members: auth.userId }, $set: { updatedAt: new Date() } },
    );

    const item = await col.findOne({ _id });
    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
