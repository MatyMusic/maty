// src/app/api/farbrengen/rooms/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const cli = await clientPromise;
  const db = cli.db(process.env.MONGODB_DB || "maty-music");
  const rooms = await db
    .collection("farb_rooms")
    .find({})
    .sort({ live: -1, startsAt: 1, createdAt: -1 })
    .limit(60)
    .toArray();
  return NextResponse.json({
    ok: true,
    items: rooms.map((r) => ({ ...r, _id: String(r._id) })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user)
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );

  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const doc = {
    title: String(body.title || "").slice(0, 120),
    description: String(body.description || "").slice(0, 1400),
    type: ["text", "audio", "video"].includes(body.type) ? body.type : "text",
    audience: ["mixed", "men", "women"].includes(body.audience)
      ? body.audience
      : "mixed",
    visibility: ["public", "private", "invite"].includes(body.visibility)
      ? body.visibility
      : "public",
    tags: Array.isArray(body.tags)
      ? body.tags.slice(0, 12).map((t: string) => String(t).toLowerCase())
      : [],
    ownerId: (session.user as any).id || session.user.email!,
    moderators: [],
    live: !!body.live,
    startsAt: body.startsAt || null,
    endsAt: body.endsAt || null,
    createdAt: now,
    updatedAt: now,
  };

  const cli = await clientPromise;
  const db = cli.db(process.env.MONGODB_DB || "maty-music");
  const res = await db.collection("farb_rooms").insertOne(doc);
  return NextResponse.json({
    ok: true,
    room: { ...doc, _id: String(res.insertedId) },
  });
}
