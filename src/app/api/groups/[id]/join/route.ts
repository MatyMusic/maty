// src/app/api/groups/[id]/join/route.ts
import { NextResponse } from "next/server";
import { joinGroup, leaveGroup } from "@/lib/db/groups-repo";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "");
  if (!userId)
    return NextResponse.json(
      { ok: false, error: "userId required" },
      { status: 400 },
    );

  const m = await joinGroup(params.id, userId);
  return NextResponse.json({ ok: true, member: m });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(req.url);
  const userId = String(url.searchParams.get("userId") || "");
  if (!userId)
    return NextResponse.json(
      { ok: false, error: "userId required" },
      { status: 400 },
    );
  await leaveGroup(params.id, userId);
  return NextResponse.json({ ok: true });
}
