// src/app/api/nigunim/route.ts
import { NextResponse } from "next/server";
import { MongoClient, Db } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const URI =
  process.env.MONGODB_URI_NIGUNIM ||
  process.env.MONGODB_URI ||
  "mongodb+srv://matymusic:matymusic@matymusic.3gmzc3w.mongodb.net/maty-nigunim?retryWrites=true&w=majority&appName=matymusic";
const DB_NAME = process.env.MONGODB_DB_NIGUNIM || "maty-nigunim";

let client: MongoClient | null = null;
async function db(): Promise<Db> {
  if (!client) {
    client = new MongoClient(URI);
    await client.connect();
  }
  return client.db(DB_NAME);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function rx(q?: string) {
  if (!q) return null;
  try {
    return new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  } catch {
    return null;
  }
}

function parseSources(srcParam: string | null) {
  const set = new Set(
    (srcParam || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  // המקורות היחידים שהקומפוננטה מכירה
  const allowed = new Set(["nigunim", "local", "youtube", "spotify"]);
  const wanted = [...set].filter((s) => allowed.has(s));
  return wanted.length ? new Set(wanted) : new Set(["nigunim"]); // ברירת מחדל
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // פילטרים בסיסיים
    const q = url.searchParams.get("q") || "";
    const category = url.searchParams.get("category") || "";
    const tag = url.searchParams.get("tag") || "";
    const mood = url.searchParams.get("mood") || "";
    const tempo = url.searchParams.get("tempo") || "";
    const bpmMin = Number(url.searchParams.get("bpmMin") || "0") || 0;
    const bpmMax = Number(url.searchParams.get("bpmMax") || "0") || 0;

    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("limit") || "60")),
    );
    const skip = (page - 1) * limit;

    const wantSources = parseSources(url.searchParams.get("source")); // Set<"nigunim"|"local"|"youtube"|"spotify">

    const _db = await db();

    // ── AUDIO (Internet Archive וכו’) → source = "nigunim"
    // נשענים על אוסף: nigun_audio
    const audioMatch: any = {};
    const r = rx(q);
    if (r) audioMatch.$or = [{ title: r }, { artist: r }, { album: r }];
    if (category) audioMatch.tags = { $in: [category] };
    if (tag) {
      audioMatch.tags = audioMatch.tags
        ? {
            $all: [
              tag,
              ...(Array.isArray(audioMatch.tags.$in)
                ? audioMatch.tags.$in
                : []),
            ],
          }
        : { $in: [tag] };
    }
    if (mood) audioMatch.mood = mood;
    if (tempo) audioMatch.tempo = tempo;
    if (bpmMin || bpmMax) {
      audioMatch.bpm = {};
      if (bpmMin) audioMatch.bpm.$gte = bpmMin;
      if (bpmMax) audioMatch.bpm.$lte = bpmMax;
    }
    audioMatch.broken = { $ne: true }; // אל תביא שבורים

    const wantAudio = wantSources.has("nigunim"); // מקור DB

    // ── EMBED (Chabad.info → YouTube/SoundCloud) → source = "youtube"
    // נשענים על אוסף: nigun_embed
    const embedMatch: any = {};
    if (r) embedMatch.$or = [{ title: r }];
    if (category) embedMatch.tags = { $in: [category] };
    if (tag) {
      embedMatch.tags = embedMatch.tags
        ? {
            $all: [
              tag,
              ...(Array.isArray(embedMatch.tags.$in)
                ? embedMatch.tags.$in
                : []),
            ],
          }
        : { $in: [tag] };
    }

    const wantEmbed = wantSources.has("youtube"); // נראה בקומפוננטה כ־youtube

    // נבנה pipeline מאוחד
    const pipeline: any[] = [];

    if (wantAudio) {
      pipeline.push(
        { $match: audioMatch },
        {
          $project: {
            _id: 0,
            id: { $toString: "$_id" },
            title: 1,
            artists: {
              $cond: [{ $ifNull: ["$artist", false] }, ["$artist"], []],
            },
            url: "$audioUrl",
            link: "$sourceItemUrl",
            cover: "$coverUrl",
            duration: "$duration",
            tags: 1,
            mood: 1,
            tempo: 1,
            bpm: 1,
            origin: "$origin",
            sourceUrl: "$sourceItemUrl",
            source: { $literal: "nigunim" }, // חשוב לקומפוננטה
            updatedAt: { $ifNull: ["$updatedAt", "$createdAt"] },
          },
        },
      );
    } else {
      // כדי לא לשבור unionWith בהמשך, מתחילים מאוסף קיים
      pipeline.push({ $match: { _id: { $exists: false } } });
    }

    if (wantEmbed) {
      pipeline.push({
        $unionWith: {
          coll: "nigun_embed",
          pipeline: [
            { $match: embedMatch },
            {
              $project: {
                _id: 0,
                id: { $toString: "$_id" },
                title: 1,
                artists: {
                  $cond: [
                    { $ifNull: ["$creditedTo", false] },
                    ["$creditedTo"],
                    [],
                  ],
                },
                url: null, // אין קובץ אודיו ישיר
                link: "$pageUrl",
                cover: "$coverUrl",
                duration: null,
                tags: 1,
                mood: 1,
                tempo: 1,
                bpm: 1,
                origin: "$origin", // "chabad.info"
                sourceUrl: "$pageUrl",
                source: { $literal: "youtube" }, // יוצג כ־YouTube בכפתור
                updatedAt: { $ifNull: ["$updatedAt", "$createdAt"] },
              },
            },
          ],
        },
      });
    }

    // מיון → עדכניות/כותרת; כאן נלך על עדכניות
    pipeline.push(
      { $sort: { updatedAt: -1, id: -1 } },
      { $skip: skip },
      { $limit: limit },
    );

    const items = await _db
      .collection("nigun_audio")
      .aggregate(pipeline, { allowDiskUse: true })
      .toArray();

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
