// USING NEW IMPORT SCRIPT v3 — Windows friendly, supports flags OR bare args
import "dotenv/config";
import { MongoClient } from "mongodb";

const API = "https://www.googleapis.com/youtube/v3";
const KEY = process.env.YOUTUBE_API_KEY!;
const MONGO = process.env.MONGODB_URI || process.env.MONGODB_URI_NIGUNIM!;
const DB =
  process.env.MONGODB_DB || process.env.MONGODB_DB_NIGUNIM || "maty-music";
if (!KEY) throw new Error("❌ חסר YOUTUBE_API_KEY ב-.env.local");
if (!MONGO) throw new Error("❌ חסר MONGODB_URI (.env.local)");

/* ---------- ARG PARSER (תומך גם ב--query "..." וגם ב: 'Chabad nigun 200') ---------- */
function parseArgs(raw: string[]) {
  // 1) נסה דגלים
  const out: any = {};
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i];
    if (a?.startsWith("--")) {
      const key = a.replace(/^--/, "");
      const next = raw[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = "true";
      }
    }
  }
  if (out.query || out.playlist || out.channel) return out;

  // 2) בלי דגלים: למשל `npm run import:yt -- "Chabad nigun" 200`
  //    החוק: אם הטוקן האחרון מספר → זה limit; כל היתר = query (מחרוזת מאוחדת).
  if (raw.length) {
    const last = raw[raw.length - 1];
    const maybeNum = Number(last);
    if (!Number.isNaN(maybeNum) && last.trim() !== "") {
      out.limit = String(maybeNum);
      out.query = raw
        .slice(0, raw.length - 1)
        .join(" ")
        .trim();
    } else {
      out.query = raw.join(" ").trim();
    }
  }
  return out;
}

async function yt(path: string, params: Record<string, string>) {
  const url = new URL(API + path);
  url.searchParams.set("key", KEY);
  for (const [k, v] of Object.entries(params))
    if (v) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok)
    throw new Error(`YouTube ${path} ${res.status} — ${await res.text()}`);
  return res.json() as Promise<any>;
}
function isoToSec(iso?: string) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "") || [];
  return (
    parseInt(m[1] || "0") * 3600 +
    parseInt(m[2] || "0") * 60 +
    parseInt(m[3] || "0")
  );
}
async function idsFromQuery(q: string, max: number) {
  const out: string[] = [];
  let pageToken: string | undefined;
  while (out.length < max) {
    const data = await yt("/search", {
      part: "snippet",
      type: "video",
      videoCategoryId: "10",
      maxResults: "50",
      q,
      pageToken: pageToken || "",
    });
    for (const it of data.items || []) {
      const id = it?.id?.videoId;
      if (id && !out.includes(id)) out.push(id);
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return out.slice(0, max);
}
async function fetchVideos(ids: string[]) {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
  const all: any[] = [];
  for (const c of chunks) {
    const d = await yt("/videos", {
      part: "snippet,contentDetails",
      id: c.join(","),
    });
    all.push(...(d.items || []));
  }
  return all;
}

(async function main() {
  console.log("USING NEW IMPORT SCRIPT v3");
  const argv = parseArgs(process.argv.slice(2));
  const query = (argv.query || "").trim();
  const playlist = (argv.playlist || "").trim();
  const channel = (argv.channel || "").trim();
  const tag = (argv.tag || "").trim();
  const limit = Math.max(
    1,
    Math.min(parseInt(argv.limit || "200", 10) || 200, 500),
  );

  if (!query && !playlist && !channel) {
    console.log(`שימוש:
  npm run import:yt -- --query "מילת חיפוש" [--tag chabad] [--limit 200]
  # או בלי דגלים:
  npm run import:yt -- "Chabad nigun" 200
`);
    process.exit(0);
  }

  console.log("▶️  starting…", { query, playlist, channel, tag, limit, DB });
  let ids: string[] = [];
  if (query) ids = await idsFromQuery(query, limit);
  // (לצורך פשטות — כרגע רק query. צריך channel/playlist? אגיד ואוסיף 2 פונקציות קטנות)
  console.log("found ids:", ids.length);

  if (!ids.length) {
    console.log("⚠️  לא נמצאו תוצאות");
    return;
  }

  const vids = await fetchVideos(ids);
  const now = new Date();
  const docs = vids.map((v: any) => {
    const sn = v.snippet || {};
    return {
      _id: `yt:${v.id}`,
      source: "youtube",
      videoId: v.id,
      title: sn.title,
      channelId: sn.channelId,
      channelTitle: sn.channelTitle,
      description: sn.description,
      thumbnails: sn.thumbnails || {},
      durationSec: isoToSec(v.contentDetails?.duration),
      publishedAt: sn.publishedAt,
      tags: (sn.tags || []).concat(tag ? [tag] : []),
      categories: tag ? [tag] : [],
      updatedAt: now, // <-- רק כאן; createdAt יהיה רק ב-$setOnInsert
    };
  });

  const cli = new MongoClient(MONGO);
  await cli.connect();
  const col = cli.db(DB).collection("tracks");

  const ops = docs.map((d) => ({
    updateOne: {
      filter: { _id: d._id },
      update: { $set: d, $setOnInsert: { createdAt: now } }, // <-- אין כפילות על createdAt!
      upsert: true,
    },
  }));

  const res = await col.bulkWrite(ops, { ordered: false });
  console.log(
    "✅ upserted:",
    (res.upsertedCount || 0) + (res.modifiedCount || 0),
  );
  console.log("📦 db:", DB, "collection:", col.collectionName);
  await cli.close();
  console.log("✅ DONE");
})().catch((e) => {
  console.error("❌ ERROR:", e.message);
  process.exit(1);
});
