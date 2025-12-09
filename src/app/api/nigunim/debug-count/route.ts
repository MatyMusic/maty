// src/app/api/nigunim/debug-count/route.ts
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const URI =
  process.env.MONGODB_URI_NIGUNIM ||
  process.env.MONGODB_URI ||
  "mongodb+srv://matymusic:matymusic@matymusic.3gmzc3w.mongodb.net/maty-nigunim?retryWrites=true&w=majority&appName=matymusic";
const DB_NAME = process.env.MONGODB_DB_NIGUNIM || "maty-nigunim";

let client: MongoClient | null = null;
async function getDb() {
  if (!client) {
    client = new MongoClient(URI);
    await client.connect();
  }
  return client.db(DB_NAME);
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDb();
    const audio = await db.collection("nigun_audio").countDocuments();
    const embed = await db.collection("nigun_embed").countDocuments();
    const oneAudio = await db
      .collection("nigun_audio")
      .findOne({}, { projection: { title: 1, audioUrl: 1, origin: 1 } });
    const oneEmbed = await db
      .collection("nigun_embed")
      .findOne({}, { projection: { title: 1, embedUrl: 1, origin: 1 } });
    return NextResponse.json({
      ok: true,
      audio,
      embed,
      sampleAudio: oneAudio,
      sampleEmbed: oneEmbed,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "count_failed" },
      { status: 500 },
    );
  }
}
