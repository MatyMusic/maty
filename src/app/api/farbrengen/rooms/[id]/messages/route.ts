// src/app/api/farbrengen/rooms/[id]/messages/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const cli = await clientPromise;
  const db = cli.db(process.env.MONGODB_DB || "maty-music");
  const items = await db
    .collection("farb_msgs")
    .find({ roomId: String(params.id) })
    .sort({ at: 1 })
    .limit(400)
    .toArray();
  return NextResponse.json({
    ok: true,
    items: items.map((i) => ({ ...i, _id: String(i._id) })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authConfig);
  if (!session?.user)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );

  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim();
  if (!text)
    return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

  const now = new Date().toISOString();
  const doc = {
    roomId: String(params.id),
    userId: (session.user as any).id || session.user.email!,
    text,
    kind: "text",
    at: now,
  };

  const cli = await clientPromise;
  const db = cli.db(process.env.MONGODB_DB || "maty-music");
  const res = await db.collection("farb_msgs").insertOne(doc);
  return NextResponse.json({
    ok: true,
    item: { ...doc, _id: String(res.insertedId) },
  });
}
