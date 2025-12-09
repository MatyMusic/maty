// scripts/import-all.ts
// יבוא אלפים מ: Internet Archive + Jamendo + Spotify -> MongoDB.tracks
// שומר playable=true רק כשיש מקור ניגון אמיתי (audioUrl/previewUrl)

import "dotenv/config";
import { MongoClient, Collection } from "mongodb";

/* ========= ENV ========= */
const MONGO = process.env.MONGODB_URI!;
const DBNAME = process.env.MONGODB_DB || "maty-music";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || "";

if (!MONGO) throw new Error("Missing MONGODB_URI in .env.local");

/* ========= Helpers ========= */

type TrackDoc = {
  _id: string;
  source: "ia" | "jamendo" | "spotify";
  title: string;
  artists?: string[];
  album?: string;
  cover?: string;
  audioUrl?: string; // mp3 וכד'
  previewUrl?: string; // 30s (Spotify)
  externalUrl?: string; // קישור למקור
  durationSec?: number;
  tags: string[];
  categories: string[];
  playable: boolean;
  updatedAt: Date;
};

function sanitize(s: any, fallback = "track") {
  return (
    String(s || fallback)
      .replace(/[^\p{L}\p{N}\-_. ()]/gu, " ")
      .trim()
      .slice(0, 160) || fallback
  );
}

async function ensureIndexes(col: Collection) {
  await Promise.all([
    col.createIndex({ _id: 1 }),
    col.createIndex({ source: 1 }),
    col.createIndex({ categories: 1 }),
    col.createIndex({ playable: 1 }),
  ]);
}

async function upsert(col: Collection, docs: TrackDoc[]) {
  if (!docs.length) return { n: 0 };
  const ops = docs.map((d) => ({
    updateOne: {
      filter: { _id: d._id },
      update: { $set: d, $setOnInsert: { createdAt: d.updatedAt } }, // ללא קונפליקט createdAt
      upsert: true,
    },
  }));
  const res = await col.bulkWrite(ops, { ordered: false });
  return { n: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
}

/* ========= Internet Archive ========= */

async function iaSearch(query: string, rows = 1000) {
  const url = new URL("https://archive.org/advancedsearch.php");
  url.searchParams.set("q", `${query} AND mediatype:audio`);
  url.searchParams.set("output", "json");
  url.searchParams.set("rows", String(rows));
  const r = await fetch(url);
  const js = await r.json();
  return (js?.response?.docs || []).map((d: any) => d.identifier as string);
}

async function iaItem(identifier: string) {
  const r = await fetch(`https://archive.org/metadata/${identifier}`);
  if (!r.ok) return null;
  return r.json();
}

async function importIA(col: Collection, q: string, tag: string) {
  console.log("▶ IA:", q);
  const ids = await iaSearch(q, 1000);
  const now = new Date();
  let total = 0;

  for (const id of ids) {
    const meta = await iaItem(id);
    if (!meta) continue;
    const files = meta?.files || [];
    const title = sanitize(meta?.metadata?.title || id);
    const cover = `https://archive.org/services/img/${id}`;

    const docs: TrackDoc[] = [];
    for (const f of files) {
      const name = String(f?.name || "");
      const lower = name.toLowerCase();
      if (
        !lower.endsWith(".mp3") &&
        !lower.endsWith(".ogg") &&
        !lower.endsWith(".m4a") &&
        !lower.endsWith(".wav")
      )
        continue;
      const audioUrl = `https://archive.org/download/${id}/${encodeURIComponent(name)}`;
      const dur =
        typeof f?.length === "number"
          ? Math.round(f.length)
          : typeof f?.length === "string"
            ? Math.round(parseFloat(f.length))
            : undefined;

      docs.push({
        _id: `ia:${id}:${name}`,
        source: "ia",
        title: title,
        artists: [],
        album: undefined,
        cover,
        audioUrl,
        previewUrl: undefined,
        externalUrl: `https://archive.org/details/${id}`,
        durationSec: dur,
        tags: [tag, "archive"],
        categories: [tag],
        playable: true,
        updatedAt: now,
      });
    }

    if (docs.length) {
      const { n } = await upsert(col, docs);
      total += n;
    }
  }

  console.log("✅ IA inserted/updated:", total);
  return total;
}

/* ========= Jamendo ========= */

async function jamendoSearchAll(query: string, limit = 200, pages = 20) {
  if (!JAMENDO_CLIENT_ID) throw new Error("Missing JAMENDO_CLIENT_ID");
  const out: any[] = [];
  for (let i = 0; i < pages; i++) {
    const url = new URL("https://api.jamendo.com/v3.0/tracks/");
    url.searchParams.set("client_id", JAMENDO_CLIENT_ID);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(i * limit));
    url.searchParams.set("search", query);
    url.searchParams.set("include", "musicinfo+stats");
    url.searchParams.set("audioformat", "mp31"); // URL ישיר ל-mp3
    const r = await fetch(url);
    const js = await r.json();
    const items = js?.results || [];
    out.push(...items);
    if (items.length < limit) break;
  }
  return out;
}

function mapJamendo(t: any, tag: string): TrackDoc | null {
  const audio = t.audio || t.audiodownload;
  if (!audio) return null;
  const now = new Date();
  return {
    _id: `jm:${t.id}`,
    source: "jamendo",
    title: sanitize(t.name),
    artists: [sanitize(t.artist_name || "")].filter(Boolean),
    album: sanitize(t.album_name || ""),
    cover: t.image,
    audioUrl: audio,
    previewUrl: undefined,
    externalUrl: t.shorturl || t.shareurl,
    durationSec: typeof t.duration === "number" ? t.duration : undefined,
    tags: [tag, "jamendo"],
    categories: [tag],
    playable: true,
    updatedAt: now,
  };
}

async function importJamendo(col: Collection, q: string, tag: string) {
  console.log("▶ Jamendo:", q);
  const items = await jamendoSearchAll(q, 200, 20); // עד ~4000 לטווח
  const docs = items
    .map((it) => mapJamendo(it, tag))
    .filter(Boolean) as TrackDoc[];
  const { n } = await upsert(col, docs);
  console.log("✅ Jamendo inserted/updated:", n);
  return n;
}

/* ========= Spotify ========= */

async function spotifyToken(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET)
    throw new Error("Missing SPOTIFY_CLIENT_ID/SECRET");
  const b64 = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${b64}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const js = await r.json();
  if (!r.ok) throw new Error("spotify token: " + JSON.stringify(js));
  return js.access_token as string;
}

async function spotifySearchTracks(
  q: string,
  token: string,
  limit = 50,
  pages = 40,
) {
  const out: any[] = [];
  for (let i = 0; i < pages; i++) {
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", q);
    url.searchParams.set("type", "track");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(i * limit));
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const js = await r.json();
    if (!r.ok) throw new Error("spotify search: " + JSON.stringify(js));
    const items = js?.tracks?.items || [];
    out.push(...items);
    if (items.length < limit) break;
  }
  return out;
}

function mapSpotify(t: any, tag: string): TrackDoc {
  const now = new Date();
  const artists = (t.artists || [])
    .map((a: any) => sanitize(a.name))
    .filter(Boolean);
  const cover = t.album?.images?.[0]?.url;
  const preview = t.preview_url || undefined;
  const external = t.external_urls?.spotify || undefined;
  return {
    _id: `sp:${t.id}`,
    source: "spotify",
    title: sanitize(t.name),
    artists,
    album: sanitize(t.album?.name || ""),
    cover,
    audioUrl: undefined,
    previewUrl: preview, // לנגן ב<audio> אם קיים
    externalUrl: external,
    durationSec: Math.round((t.duration_ms || 0) / 1000),
    tags: [tag, "spotify"],
    categories: [tag],
    playable: !!preview, // רק אם יש preview
    updatedAt: now,
  };
}

async function importSpotify(col: Collection, q: string, tag: string) {
  console.log("▶ Spotify:", q);
  const token = await spotifyToken();
  const items = await spotifySearchTracks(q, token, 50, 40); // עד ~2000 לשאילתה
  const docs = items.map((it) => mapSpotify(it, tag));
  const { n } = await upsert(col, docs);
  console.log("✅ Spotify inserted/updated:", n);
  return n;
}

/* ========= MAIN ========= */

(async function main() {
  console.log("▶ import-all starting… DB:", DBNAME);
  const mongo = new MongoClient(MONGO);
  await mongo.connect();
  const col = mongo.db(DBNAME).collection("tracks");
  await ensureIndexes(col);

  // ערכות חיפוש (אפשר להרחיב/לשנות)
  const IA_QUERIES: Array<[string, string]> = [
    ["chabad nigun", "chabad"],
    ['ניגוני חב"ד', "chabad"],
    ["breslov nigun", "breslov"],
    ["ניגוני ברסלב", "breslov"],
    ["klezmer jewish", "klezmer"],
  ];
  const JM_QUERIES: Array<[string, string]> = [
    ["klezmer", "klezmer"],
    ["jewish", "jewish"],
  ];
  const SP_QUERIES: Array<[string, string]> = [
    ['artist:"Shlomo Carlebach"', "carlebach"],
    ["Chabad nigun", "chabad"],
    ["Breslov nigun", "breslov"],
  ];

  let sumIA = 0,
    sumJM = 0,
    sumSP = 0;

  for (const [q, tag] of IA_QUERIES) sumIA += await importIA(col, q, tag);
  if (JAMENDO_CLIENT_ID)
    for (const [q, tag] of JM_QUERIES)
      sumJM += await importJamendo(col, q, tag);
  if (SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET)
    for (const [q, tag] of SP_QUERIES)
      sumSP += await importSpotify(col, q, tag);

  console.log("🎯 SUMMARY:", { IA: sumIA, Jamendo: sumJM, Spotify: sumSP });

  // ביטחון: סימון playable לפי שדות קיימים (לא ידרוס אם כבר true)
  await col.updateMany({}, [
    {
      $set: {
        playable: {
          $cond: [
            {
              $or: [
                {
                  $and: [
                    { $ne: ["$audioUrl", null] },
                    { $ne: ["$audioUrl", ""] },
                  ],
                },
                {
                  $and: [
                    { $ne: ["$previewUrl", null] },
                    { $ne: ["$previewUrl", ""] },
                  ],
                },
              ],
            },
            true,
            "$playable",
          ],
        },
        updatedAt: new Date(),
      },
    },
  ]);

  await mongo.close();
  console.log("✅ DONE import-all");
})().catch((e) => {
  console.error("❌ ERROR:", e);
  process.exit(1);
});
