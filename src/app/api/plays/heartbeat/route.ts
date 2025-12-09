import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db/mongo-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// שולחים כל 15–30 שניות עם playedMs מאז ה-start
export async function POST(req: Request) {
  try {
    const {
      trackId,
      userId,
      anonId,
      playedMs = 0,
      src = "nigunim",
    } = await req.json();
    if (!trackId || !/^[a-f\d]{24}$/i.test(String(trackId))) {
      return NextResponse.json(
        { ok: false, error: "bad_trackId" },
        { status: 400 },
      );
    }

    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB as string);

    await db.collection("music_play_events").insertOne({
      type: "heartbeat",
      trackId: String(trackId),
      src: String(src),
      userId: userId || null,
      anonId: anonId || null,
      playedMs: Math.max(0, Number(playedMs) || 0),
      at: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
