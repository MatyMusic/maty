// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db/mongoose";

// מייבאים מודלים ישירות (למנוע בלבול named/default)
import Beat from "@/models/club/Beat";
import Post from "@/models/club/Post";
import Gift from "@/models/club/Gift";
import Payment from "@/models/club/Payment";
import Profile from "@/models/club/Profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

// --- חיבור אופציונלי ל-DB הניגונים (אם הוגדר בסביבה) ---
import { MongoClient } from "mongodb";
let nigunClient: MongoClient | null = null;

async function getNigunClient() {
  const uri = process.env.MONGODB_URI_NIGUNIM || "";
  if (!uri) return null;
  if (nigunClient) return nigunClient;
  nigunClient = new MongoClient(uri, { monitorCommands: false });
  await nigunClient.connect();
  return nigunClient;
}

export async function GET() {
  try {
    // --- DB ראשי (FLUB/CLUB) ---
    const m = await connectDB();
    const db = m.connection.db;

    // ספירת קולקציות כלליות (אם קיימות) – ננסה בעדינות
    const usersCount = await safeCount(db, "users");
    const mediaAudio = await safeCount(db, "media", { kind: "audio" });

    // ספירות מ־Mongoose
    const [beats, posts, gifts, payments, profiles, shorts] = await Promise.all(
      [
        Beat.estimatedDocumentCount(),
        Post.estimatedDocumentCount(),
        Gift.estimatedDocumentCount(),
        Payment.estimatedDocumentCount(),
        Profile.estimatedDocumentCount(),
        Post.countDocuments({ videoUrl: { $exists: true, $ne: "" } }),
      ],
    );

    // --- DB ניגונים (אופציונלי) ---
    let nigunim = 0;
    try {
      const nc = await getNigunClient();
      if (nc) {
        const nigDB = nc.db(process.env.MONGODB_DB_NIGUNIM || "maty-nigunim");
        // אם אין קולקציה — הספירה תחזיר 0
        nigunim = await nigDB
          .collection("nigunim")
          .countDocuments({})
          .catch(() => 0);
      }
    } catch {
      // מתעלמים בשקט — זה שדה אופציונלי
      nigunim = 0;
    }

    const payload = {
      ok: true,
      ts: Date.now(),
      stats: {
        users: usersCount,
        mediaAudio,
        beats,
        posts,
        shorts, // פוסטים עם videoUrl
        gifts,
        payments,
        profiles,
        nigunim,

        // תאימות ל־Header הישן אם נשאר אצלך:
        pendingBookings: 0,
        activeHolds: 0,
      },
      db: {
        name: db.databaseName,
        host: (mongoose.connection as any)?.host ?? undefined,
      },
    };

    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err: any) {
    console.error("[/api/admin/stats] error:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: err?.message || "server_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

/* ================= helpers ================= */

async function safeCount(
  db: mongoose.mongo.Db,
  collectionName: string,
  filter: Record<string, any> = {},
) {
  try {
    const names = await db.listCollections({ name: collectionName }).toArray();
    if (!names.length) return 0;
    return await db.collection(collectionName).countDocuments(filter);
  } catch {
    return 0;
  }
}
