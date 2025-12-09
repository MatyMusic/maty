import "dotenv/config";
import { MongoClient } from "mongodb";

const COLL = process.env.TRACKS_COLLECTION || "tracks";

function playable(t: any) {
  const urlFields = [
    t?.audioUrl,
    t?.url,
    t?.file,
    t?.audio,
    t?.streamUrl,
    t?.src,
  ].filter((x) => typeof x === "string" && x.trim() !== "");
  const youtubeId = t?.youtube?.id || t?.youtubeId || t?.ytId;
  const spotifyPreview =
    t?.spotify?.preview_url || t?.spotifyPreview || t?.preview_url;
  const link = t?.link;
  return (
    urlFields.length > 0 ||
    (typeof spotifyPreview === "string" && spotifyPreview.trim() !== "") ||
    (typeof youtubeId === "string" && youtubeId.trim() !== "") ||
    (typeof link === "string" && link.trim() !== "")
  );
}

function fixCover(cover?: string): string | undefined {
  if (!cover) return cover;
  return cover.replace("/video/upload/", "/image/upload/");
}

async function run() {
  const uri = process.env.MONGODB_URI!;
  const client = await new MongoClient(uri).connect();
  const db = client.db(process.env.MONGODB_DB);
  const col = db.collection(COLL);

  const total = await col.countDocuments();
  console.log(`[${COLL}] total:`, total);

  const cursor = col.find(
    {},
    {
      projection: {
        _id: 1,
        title: 1,
        artist: 1,
        audioUrl: 1,
        link: 1,
        youtube: 1,
        spotify: 1,
        coverUrl: 1,
        cover: 1,
      },
    }
  );
  let fixedCovers = 0,
    disabled = 0,
    enabled = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const updates: any = {};

    // תקן cover video→image
    const cv = doc.coverUrl || doc.cover;
    if (
      typeof cv === "string" &&
      /res\.cloudinary\.com/.test(cv) &&
      /\/video\/upload\//.test(cv)
    ) {
      updates.coverUrl = fixCover(cv);
      fixedCovers++;
    }

    const canPlay = playable(doc);
    if (!canPlay) {
      if (doc.isDisabled !== true) (updates.isDisabled = true), disabled++;
    } else {
      if (doc.isDisabled === true) (updates.isDisabled = false), enabled++;
    }

    if (Object.keys(updates).length) {
      await col.updateOne({ _id: doc._id }, { $set: updates });
    }
  }

  console.log({
    fixedCovers,
    disabledNoPlayableSource: disabled,
    reenabledPlayable: enabled,
  });
  await client.close();
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
