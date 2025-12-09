// npx tsx scripts/bulk-fill-audio-urls.ts
import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI_NIGUNIM || process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB_NIGUNIM || "maty-nigunim";
const COLL = "nigunim";

// איפה יושבים האודיו. הוסף/שנה לפי הצורך:
const CDN_BASES = [
  "https://cdn.maty.co/audio",
  // "https://storage.googleapis.com/BUCKET/audio",
  // "https://res.cloudinary.com/<cloud>/video/upload" // אם זה Cloudinary, קרא הערה בתחתית
];

const EXTS = ["mp3", "m4a", "ogg", "wav"];

// slug בעברית ידידותי לקבצים
function slugify(s: string) {
  return (s || "")
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "") // ניקוד עברי
    .replace(/[״"׳'`]/g, "")
    .replace(/[()[\]{}.,!?;:]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .trim();
}

async function headOk(url: string, timeoutMs = 2500): Promise<boolean> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "HEAD", signal: ctl.signal });
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    return (
      res.ok &&
      (ct.includes("audio") || ct === "") /*חלק מה-CDN לא שולח CT ב-HEAD*/
    );
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

function candidates(id: string, title: string) {
  const s = slugify(title);
  const byId = EXTS.flatMap((ext) => CDN_BASES.map((b) => `${b}/${id}.${ext}`));
  const bySlug = EXTS.flatMap((ext) =>
    CDN_BASES.map((b) => `${b}/${s}.${ext}`)
  );
  return [...byId, ...bySlug];
}

async function run() {
  const cli = new MongoClient(MONGO_URI);
  await cli.connect();
  const col = cli.db(DB_NAME).collection(COLL);

  // אינדקסים מומלצים
  await col.createIndex({ audioUrl: 1 });
  await col.createIndex({ title: 1 });

  const cursor = col
    .find(
      { $or: [{ audioUrl: { $exists: false } }, { audioUrl: "" }] },
      { projection: { _id: 1, title: 1 } }
    )
    .batchSize(500);

  let matched = 0,
    modified = 0,
    scanned = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) break;
    scanned++;

    const id = String(doc._id);
    const title = String(doc.title || "");
    const urls = candidates(id, title);

    let found: string | null = null;
    for (const u of urls) {
      if (await headOk(u)) {
        found = u;
        break;
      }
    }

    if (found) {
      matched++;
      const res = await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { audioUrl: found }, $unset: { sampleUrl: "" } }
      );
      modified += res.modifiedCount;
      if (matched % 200 === 0) {
        console.log(
          `progress: scanned=${scanned} matched=${matched} modified=${modified}`
        );
      }
    }
  }

  console.log(
    `DONE scanned=${scanned} matched=${matched} modified=${modified}`
  );
  await cli.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

/*
אם אתה ב-Cloudinary: כדאי לשמור public_id תואם ל-id/slug ואז ה-URL:
  https://res.cloudinary.com/<cloud>/video/upload/<public_id>.mp3
שים לב: לאודיו ב-Cloudinary משתמשים ב-resource_type=video.
*/
