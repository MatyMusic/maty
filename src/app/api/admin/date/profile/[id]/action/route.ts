// src/app/api/admin/date/profile/[id]/action/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await requireAdmin("admin");
  const id = params.id;
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ ok: false, error: "bad id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action as "verify" | "pause" | "unpause" | "block";
  if (!["verify", "pause", "unpause", "block"].includes(action)) {
    return NextResponse.json(
      { ok: false, error: "bad action" },
      { status: 400 }
    );
  }

  const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
  const C = db.collection("date_profiles");
  const _id = new ObjectId(id);

  let upd: any = {};
  switch (action) {
    case "verify":
      upd = {
        $set: {
          verifiedAt: new Date(),
          status: "verified",
          updatedAt: new Date().toISOString(),
        },
      };
      break;
    case "pause":
      upd = {
        $set: {
          paused: true,
          status: "paused",
          updatedAt: new Date().toISOString(),
        },
      };
      break;
    case "unpause":
      upd = {
        $set: {
          paused: false,
          status: "active",
          updatedAt: new Date().toISOString(),
        },
      };
      break;
    case "block":
      upd = {
        $set: {
          status: "blocked",
          paused: true,
          updatedAt: new Date().toISOString(),
        },
        $addToSet: { flags: "blocked" },
      };
      break;
  }

  await C.updateOne({ _id }, upd);
  const doc = await C.findOne({ _id });
  const state = {
    status: doc?.status,
    paused: !!doc?.paused,
    verifiedAt: doc?.verifiedAt ? String(doc?.verifiedAt) : null,
  };

  return NextResponse.json(
    { ok: true, state },
    { headers: { "Cache-Control": "no-store" } }
  );
}
