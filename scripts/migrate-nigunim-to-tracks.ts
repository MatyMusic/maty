import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const SRC_COLLECTION = process.env.SRC_COLLECTION || "nigunim";
const DEST_COLLECTION = process.env.DEST_COLLECTION || "tracks";
type AnyTrack = Record<string, any>;

function normalizeCover(url?: string) {
  if (!url) return url;
  return url.replace("/video/upload/", "/image/upload/");
}

function hasPlayable(t: AnyTrack) {
  const urlCandidates = [
    t.url,
    t.file,
    t.audio,
    t.audioUrl,
    t.streamUrl,
    t.src,
  ].filter((x) => typeof x === "string" && x.trim() !== "");
  const yt = t.youtube?.id || t.youtubeId || t.ytId;
  const sp = t.spotify?.preview_url || t.spotifyPreview || t.preview_url;
  const link = t.link;
  return (
    urlCandidates.length > 0 ||
    (typeof sp === "string" && sp.trim() !== "") ||
    (typeof yt === "string" && yt.trim() !== "") ||
    (typeof link === "string" && link.trim() !== "")
  );
}

function mapToDest(src: AnyTrack) {
  let title = (src.title ?? "").toString().trim();
  const artist = src.artist ? src.artist.toString().trim() : undefined;

  if (!title) {
    const guessFrom =
      src.url ||
      src.file ||
      src.audio ||
      src.audioUrl ||
      src.src ||
      src.link ||
      "";
    if (typeof guessFrom === "string" && guessFrom) {
      title = decodeURIComponent(guessFrom.split("/").pop() || "")
        .split("?")[0]
        .replace(/\.[a-z0-9]+$/i, "");
    }
    if (!title) title = "Untitled";
  }

  const primaryUrl =
    src.audioUrl ||
    src.url ||
    src.file ||
    src.audio ||
    src.streamUrl ||
    src.src ||
    null;
  const coverUrl =
    normalizeCover(src.coverUrl || src.cover || src.thumbUrl || undefined) ||
    undefined;

  const doc: AnyTrack = {
    title,
    artist,
    audioUrl: primaryUrl || undefined,
    coverUrl,
    youtube: src.youtube?.id
      ? { id: src.youtube.id }
      : src.youtubeId || src.ytId
      ? { id: src.youtubeId || src.ytId }
      : undefined,
    spotify: src.spotify?.preview_url
      ? { preview_url: src.spotify.preview_url }
      : src.spotifyPreview || src.preview_url
      ? { preview_url: src.spotifyPreview || src.preview_url }
      : undefined,
    tags: Array.isArray(src.tags) ? src.tags : undefined,
    category: src.category || undefined,
    updatedAt: new Date(),
    published: src.published ?? true,
  };

  if (!hasPlayable(src)) doc.isDisabled = true;
  return doc;
}

async function ensureIndexes(col: any) {
  await col.createIndex({ sourceId: 1 });
  await col.createIndex({ title: 1, artist: 1 });
  await col.createIndex({ published: 1 });
  await col.createIndex({ isDisabled: 1 });
  await col.createIndex({ updatedAt: -1 });
}

async function run() {
  const destUri = process.env.MONGODB_URI!;
  const destDbName = process.env.MONGODB_DB!;
  const srcUri = process.env.MONGODB_URI_NIGUNIM!;
  const srcDbName = process.env.MONGODB_DB_NIGUNIM!;
  if (!destUri || !destDbName || !srcUri || !srcDbName) {
    throw new Error(
      "Missing one of: MONGODB_URI, MONGODB_DB, MONGODB_URI_NIGUNIM, MONGODB_DB_NIGUNIM"
    );
  }

  const [srcClient, destClient] = await Promise.all([
    new MongoClient(srcUri).connect(),
    new MongoClient(destUri).connect(),
  ]);

  const srcDb = srcClient.db(srcDbName);
  const destDb = destClient.db(destDbName);
  const srcCol = srcDb.collection(SRC_COLLECTION);
  const destCol = destDb.collection(DEST_COLLECTION);

  const total = await srcCol.countDocuments();
  console.log(`[source ${srcDbName}.${SRC_COLLECTION}] total: ${total}`);

  await ensureIndexes(destCol);

  const BATCH = 1000;
  let processed = 0,
    inserted = 0,
    updated = 0;
  let bulk: any[] = [];

  async function flush() {
    if (!bulk.length) return;
    const res = await destCol.bulkWrite(bulk, { ordered: false });
    inserted += res.upsertedCount || 0;
    updated += res.modifiedCount || 0;
    bulk = [];
    console.log(
      `progress: ${processed}/${total} | inserted: ${inserted} | updated: ${updated}`
    );
  }

  const cursor = srcCol.find({});
  while (await cursor.hasNext()) {
    const srcDoc = await cursor.next();
    const mapped = mapToDest(srcDoc);

    delete (mapped as any).createdAt;
    delete (mapped as any)._id;

    const sourceId =
      srcDoc._id instanceof ObjectId
        ? srcDoc._id.toString()
        : String(srcDoc._id);
    const setOnInsert = {
      createdAt: srcDoc.createdAt ? new Date(srcDoc.createdAt) : new Date(),
      sourceId,
    };
    const key = { sourceId };

    bulk.push({
      updateOne: {
        filter: key,
        update: { $setOnInsert: setOnInsert, $set: mapped },
        upsert: true,
      },
    });

    processed++;
    if (bulk.length >= BATCH) await flush();
  }

  await flush();
  console.log(
    `DONE. processed: ${processed} | inserted: ${inserted} | updated: ${updated}`
  );

  await srcClient.close();
  await destClient.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
