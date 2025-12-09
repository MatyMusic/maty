// src/app/api/admin/users/[id]/route.ts  (GET one, PATCH, DELETE)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/mongo";

function idOf(s: string | null) {
  try {
    return s ? new ObjectId(s) : null;
  } catch {
    return null;
  }
}
function isAdmin(session: any) {
  const role = session?.user?.role ?? "user";
  return !!session && ["admin", "superadmin"].includes(role);
}

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session))
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );

  const _id = idOf(params.id);
  if (!_id)
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });

  const col = await getCollection("users");
  const row = await col.findOne({ _id }, { projection: { password: 0 } });
  if (!row)
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 }
    );
  return NextResponse.json({ ok: true, row });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session))
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );

  const _id = idOf(params.id);
  if (!_id)
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const set: any = { updatedAt: new Date() };
  if (body?.name !== undefined) set.name = String(body.name);
  if (body?.email !== undefined) set.email = String(body.email).toLowerCase();
  if (body?.phone !== undefined) set.phone = String(body.phone || "");
  if (["admin", "user", "superadmin"].includes(body?.role))
    set.role = body.role;
  if (["active", "pending", "blocked"].includes(body?.status))
    set.status = body.status;
  if (body?.address) {
    set.address = {
      line1: body.address.line1 || undefined,
      city: body.address.city || undefined,
      country: body.address.country || undefined,
    };
  }

  const col = await getCollection("users");
  await col.updateOne({ _id }, { $set: set });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session))
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );

  const _id = idOf(params.id);
  if (!_id)
    return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });

  const col = await getCollection("users");
  await col.deleteOne({ _id });
  return NextResponse.json({ ok: true });
}
