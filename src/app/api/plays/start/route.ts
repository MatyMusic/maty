import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db/mongo-client";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hash(value: string | null | undefined, salt: string) {
  if (!value) return undefined;
  return crypto.createHmac("sha256", salt).update(value).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { trackId, src = "nigunim", userId, anonId } = await req.json();
    if (!trackId || !/^[a-f\d]{24}$/i.test(String(trackId))) {
      return NextResponse.json(
        { ok: false, error: "bad_trackId" },
        { status: 400 },
      );
    }

    const ip = (
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      ""
    )
      .split(",")[0]
      .trim();
    const ua = req.headers.get("user-agent") || "";
    const salt =
      process.env.NEXTAUTH_SECRET || process.env.MONGODB_DB || "maty";

    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB as string);

    await db.collection("music_play_events").insertOne({
      type: "start",
      trackId: String(trackId),
      src: String(src),
      userId: userId || null,
      anonId: anonId || null,
      ipHash: hash(ip, salt),
      uaHash: hash(ua, salt),
      startedAt: new Date(),
      at: new Date(),
      playedMs: 0,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
