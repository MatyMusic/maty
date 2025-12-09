import "dotenv/config";
import { MongoClient } from "mongodb";
import fetch from "node-fetch";

const BATCH = 200;

async function getAccessToken() {
  const id = process.env.SPOTIFY_CLIENT_ID!;
  const secret = process.env.SPOTIFY_CLIENT_SECRET!;
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(id + ":" + secret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error("Failed to get Spotify token");
  return data.access_token as string;
}

async function searchTrack(q: string, token: string) {
  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", q);
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json();
  const item = data?.tracks?.items?.[0];
  if (!item) return null;
  return {
    id: item.id as string,
    preview_url: (item.preview_url as string | null) || null,
    external_url:
      (item.external_urls?.spotify as string | undefined) || undefined,
    artists: (item.artists || []).map((a: any) => a.name),
    name: item.name as string,
  };
}

function buildQuery(title?: string, artist?: string) {
  const t = (title || "").trim();
  const a = (artist || "").trim();
  if (!t) return null;
  return a ? `track:${t} artist:${a}` : `track:${t}`;
}

async function run() {
  const token = await getAccessToken();

  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.MONGODB_DB!;
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);
  const col = db.collection("tracks");

  // נאתחל spotify לאובייקט ריק אם הוא null/לא קיים (במקום להיתקע בשגיאה)
  await col.updateMany(
    {
      $or: [
        { spotify: null },
        { spotify: { $exists: false } },
        { $expr: { $ne: [{ $type: "$spotify" }, "object"] } },
      ],
    },
    { $set: { spotify: {} } }
  );

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
          { $or: [{ "youtube.id": { $exists: false } }, { "youtube.id": "" }] },
        ],
      },
      { projection: { _id: 1, title: 1, artist: 1, spotify: 1 } }
    )
    .limit(BATCH);

  let tried = 0,
    updated = 0,
    noPreview = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const q = buildQuery((doc as any).title, (doc as any).artist);
    if (!q) continue;

    tried++;
    const res = await searchTrack(q, token);
    if (!res) continue;

    // נבנה spotify כ-object אחד, כדי לא להיתקל שוב ב-null fields
    const baseSpotify: any =
      (doc as any).spotify && typeof (doc as any).spotify === "object"
        ? (doc as any).spotify
        : {};

    const newSpotify: any = {
      ...baseSpotify,
      id: res.id,
      external_url: res.external_url,
    };
    if (res.preview_url) newSpotify.preview_url = res.preview_url;

    const set: any = {
      spotify: newSpotify,
      updatedAt: new Date(),
    };

    if (res.preview_url) {
      set.isDisabled = false;
      set.needsEnrichment = false;
      updated++;
    } else {
      set.needsEnrichment = false;
      noPreview++;
    }

    await col.updateOne({ _id: (doc as any)._id }, { $set: set });
  }

  console.log({ tried, updatedWithPreview: updated, noPreview });
  await client.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
