// src/app/api/date/contact-request/route.ts
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const meId = String(session.user.id);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const toUserId = String(body.toUserId || "").trim();
  if (!toUserId || toUserId === meId) {
    return NextResponse.json({ error: "invalid target" }, { status: 400 });
  }

  const cli = await clientPromise;
  const db = cli.db(dbName());
  const C = db.collection("date_contact_requests");

  const now = new Date().toISOString();

  await C.insertOne({
    fromUserId: meId,
    toUserId,
    createdAt: now,
    state: "pending",
  });

  return NextResponse.json({ ok: true });
}
