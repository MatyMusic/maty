// src/app/api/music/ingest/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import authConfig from "@/auth-config";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * גוף הבקשה (JSON):
 * { artist?: string, genre?: string|null, weight?: number=1, playedAt?: string ISO }
 * מעדכן מסמך משתמש ב-collection: music_vectors
 * מבנה: { userId, genres: { [name]: weight }, topArtists: string[], lastPlaysAt: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const userId =
      (session as any)?.user?.id || (session as any)?.user?.email || null;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const artist = (body.artist || "").trim() || null;
    const genre = (body.genre || "").trim() || null;
    const weight = Number(body.weight ?? 1) || 1;
    const playedAt =
      (body.playedAt && new Date(body.playedAt).toISOString()) ||
      new Date().toISOString();

    const cli = await clientPromise;
    const db = cli.db(process.env.MONGODB_DB || "maty-music");
    const col = db.collection("music_vectors");

    // עדכוני משקל בסיסיים
    const $inc: Record<string, number> = {};
    if (genre) $inc[`genres.${genre}`] = weight;

    const $addToSet: Record<string, any> = {};
    if (artist) $addToSet.topArtists = artist;

    const $push: Record<string, any> = {
      lastPlaysAt: {
        $each: [playedAt],
        $slice: -50, // נגביל היסטוריה
      },
    };

    await col.updateOne(
      { userId },
      {
        $inc,
        ...(artist ? { $addToSet } : {}),
        $push,
        $setOnInsert: { createdAt: new Date().toISOString() },
        $set: { updatedAt: new Date().toISOString() },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[music/ingest] error:", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
