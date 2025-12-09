import "dotenv/config";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";

const BATCH = Number(process.env.YT_ENRICH_BATCH || 200);
const REGION = process.env.YT_REGION || "IL"; // אפשר לשנות ל-"US" וכו'

function buildQuery(title?: string, artist?: string) {
  const t = (title || "").trim();
  const a = (artist || "").trim();
  if (!t) return null;
  return a ? `${t} ${a}` : t;
}

async function searchYouTube(q: string, apiKey: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "id,snippet");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", q);
  url.searchParams.set("regionCode", REGION);
  url.searchParams.set("key", apiKey);

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`YouTube search failed: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  const item = data?.items?.[0];
  if (!item) return null;

  const id = item.id?.videoId as string | undefined;
  const thumb =
    item.snippet?.thumbnails?.high?.url ||
    item.snippet?.thumbnails?.medium?.url ||
    item.snippet?.thumbnails?.default?.url ||
    (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined);

  return id ? { id, coverUrl: thumb } : null;
}

async function run() {
  const apiKey = process.env.YOUTUBE_API_KEY!;
  if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY in .env.local");

  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.MONGODB_DB!;
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);
  const col = db.collection("tracks");

  // ודא ששדה youtube הוא אובייקט (לא null) כדי למנוע שגיאות כתיבה
  await col.updateMany(
    {
      $or: [
        { youtube: null },
        { youtube: { $exists: false } },
        { $expr: { $ne: [{ $type: "$youtube" }, "object"] } },
      ],
    },
    { $set: { youtube: {} } }
  );

  // נסנן כאלה שאין להם שום מקור ניגון ולא מולאו ביוטיוב עדיין
  const cursor = col
    .find(
      {
        $and: [
          {
            $or: [
              { audioUrl: { $exists: false } },
              { audioUrl: "" },
              { audioUrl: null },
            ],
          },
          {
            $or: [
              { "spotify.preview_url": { $exists: false } },
              { "spotify.preview_url": "" },
            ],
          },
          {
            $or: [
              { "youtube.id": { $exists: false } },
              { "youtube.id": "" },
              { "youtube.id": null },
            ],
          },
        ],
      },
      { projection: { _id: 1, title: 1, artist: 1, youtube: 1 } }
    )
    .limit(BATCH);

  let tried = 0,
    updated = 0,
    notFound = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const q = buildQuery((doc as any).title, (doc as any).artist);
    if (!q) continue;

    tried++;
    const res = await searchYouTube(q, apiKey);
    if (!res) {
      notFound++;
      continue;
    }

    const newYouTube: any = { ...(doc as any).youtube, id: res.id };
    const set: any = {
      youtube: newYouTube,
      updatedAt: new Date(),
      isDisabled: false, // עכשיו יש מקור ניגון חוקי (IFrame)
      needsEnrichment: false,
    };
    if (res.coverUrl) set.coverUrl = res.coverUrl;

    await col.updateOne({ _id: (doc as any)._id }, { $set: set });
    updated++;
  }

  console.log({ tried, updatedWithYouTube: updated, notFound });
  await client.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
