// scripts/seed-nigunim.js
require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI_NIGUNIM;
const dbName = process.env.MONGODB_DB_NIGUNIM || "maty-nigunim";

if (!uri) {
  console.error("❌ Missing MONGODB_URI_NIGUNIM in .env.local");
  process.exit(1);
}

const DEMO_SONGS = [
  {
    title_he: "ניגון Uplift (demo)",
    title_en: "Nigun Uplift (demo)",
    slug: "nigun-uplift-demo",
    genre: "chabad",
    bpm: 120,
    key: "Dm",
    coverUrl:
      "https://res.cloudinary.com/demo/image/upload/v1720000000/music/nigun-uplift.jpg",
    audioUrl:
      "https://res.cloudinary.com/demo/video/upload/v1720000000/music/nigun-uplift.mp3",
    tags: ["happy", "chasidic"],
  },
  {
    title_he: "Hafa Groove (demo)",
    title_en: "Hafa Groove (demo)",
    slug: "hafa-groove-demo",
    genre: "mizrahi",
    bpm: 104,
    key: "Am",
    coverUrl:
      "https://res.cloudinary.com/demo/image/upload/v1720000000/music/hafa-groove.jpg",
    audioUrl:
      "https://res.cloudinary.com/demo/video/upload/v1720000000/music/hafa-groove.mp3",
    tags: ["groove", "mizrahi"],
  },
  {
    title_he: "לילה שקט (demo)",
    title_en: "Quiet Night (demo)",
    slug: "quiet-night-demo",
    genre: "soft",
    bpm: 84,
    key: "G",
    coverUrl:
      "https://res.cloudinary.com/demo/image/upload/v1720000000/music/quiet-night.jpg",
    audioUrl:
      "https://res.cloudinary.com/demo/video/upload/v1720000000/music/quiet-night.mp3",
    tags: ["soft", "romantic"],
  },
];

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB:", dbName);

    const db = client.db(dbName);
    const col = db.collection("songs");

    // נקה אינדקסים ישנים (אם קיימים)
    try {
      await col.dropIndexes();
    } catch {}

    // slug ייחודי
    await col.createIndex({ slug: 1 }, { unique: true });

    // אינדקס טקסט: כותרות + תגיות
    // שים לב: default_language: "none" כדי לא להיכשל על שפה לא נתמכת
    await col.createIndex(
      { title_he: "text", title_en: "text", tags: "text" },
      { name: "text_all", default_language: "none" }
    );

    const now = new Date();
    const docs = DEMO_SONGS.map((s) => ({
      ...s,
      createdAt: now,
      updatedAt: now,
      status: "published",
    }));

    for (const d of docs) {
      await col.updateOne(
        { slug: d.slug },
        { $set: d, $setOnInsert: { _seed: true } },
        { upsert: true }
      );
    }

    const count = await col.countDocuments();
    console.log(`🎵 Seed complete. Total songs: ${count}`);
  } catch (err) {
    console.error("❌ Seed error:", err.message || err);
    process.exit(1);
  } finally {
    await client.close().catch(() => {});
  }
}

run();
