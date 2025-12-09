// scripts/bulk-cloudinary-remote.ts
import 'dotenv/config';
import { MongoClient, Db, Document } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

// ========= CONFIG =========
const {
  MONGODB_URI_NIGUNIM,
  MONGODB_DB_NIGUNIM = 'maty-nigunim',
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!MONGODB_URI_NIGUNIM) throw new Error('MONGODB_URI_NIGUNIM missing');
if (!(CLOUDINARY_CLOUD_NAME || NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME))
  throw new Error('CLOUDINARY_CLOUD_NAME missing (or NEXT_PUBLIC_...)');
if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)
  throw new Error('CLOUDINARY_API_KEY/SECRET missing');

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME || NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

// ========= CLI FLAGS =========
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.split('=');
    return [k.replace(/^--/, ''), v ?? ''];
  })
);
// usage: npm run bulk:audio -- --limit=2000 --concurrency=3 --folder=maty-music --dry=0
const LIMIT = Math.max(1, Number(args.limit || 5000));
const CONCURRENCY = Math.max(1, Number(args.concurrency || 3));
const START_FROM = Math.max(0, Number(args.startFrom || 0));
const FOLDER = String(args.folder || 'maty-music');
const DRY = args.dry === '1' || args.dry === 'true';

// ========= HELPERS =========
const AUDIO_RX = /\.(mp3|m4a|ogg|wav)(\?|$)/i;
const BAD_HOSTS = ['youtube.com', 'youtu.be', 'spotify.com'];

function isLikelyDirectAudio(u?: string) {
  if (!u) return false;
  if (u.startsWith('data:') || u.startsWith('blob:')) return false;
  try {
    const U = new URL(u);
    if (!/^https?:$/.test(U.protocol)) return false;
    const host = U.hostname.toLowerCase();
    if (BAD_HOSTS.some((h) => host.includes(h))) return false;
    if (AUDIO_RX.test(U.pathname)) return true;
    // גם Cloudinary/GCS לעתים בלי סיומת – נאפשר
    if (/res\.cloudinary\.com$/.test(host) || /googleapis\.com$/.test(host))
      return true;
    return false;
  } catch {
    return false;
  }
}

const slug = (s: string) =>
  (s || '')
    .normalize('NFKD')
    .replace(/[״"׳'`]/g, '')
    .replace(/[^a-zA-Z0-9\u0590-\u05FF]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

function pickRemoteAudio(row: any): string | undefined {
  // העדפות: audioUrl > sampleUrl > url > externalUrl
  const cand = row?.audioUrl || row?.sampleUrl || row?.url || row?.externalUrl;
  return isLikelyDirectAudio(cand) ? cand : undefined;
}

function hasCloudAudio(row: any) {
  const u = row?.audioUrl || row?.sampleUrl;
  return isLikelyDirectAudio(u) && /res\.cloudinary\.com/.test(u);
}

// ========= MAIN =========
async function main() {
  const cli = await MongoClient.connect(MONGODB_URI_NIGUNIM!);
  const db: Db = cli.db(MONGODB_DB_NIGUNIM);
  const col = db.collection('nigunim');

  // מושכים רשומות שחסר להן אודיו אמיתי
  const cursor = col
    .find(
      {
        $or: [
          { audioUrl: { $exists: false } },
          { audioUrl: null },
          { audioUrl: '' },
          { sampleUrl: { $exists: false } },
          { sampleUrl: null },
          { sampleUrl: '' },
        ],
      },
      { projection: { title: 1, audioUrl: 1, sampleUrl: 1, url: 1, externalUrl: 1 } }
    )
    .limit(LIMIT + START_FROM);

  const all: Document[] = await cursor.toArray();
  const rows = all.slice(START_FROM);
  console.log(
    `Found ${all.length} docs (processing ${rows.length} from index ${START_FROM})`
  );

  let inFlight = 0;
  let done = 0;
  let skipped = 0;
  let uploaded = 0;
  let failed = 0;

  async function runOne(row: any) {
    const _id = row._id;
    const title = row.title || 'untitled';

    // אם כבר יש Cloudinary – דילוג
    if (hasCloudAudio(row)) {
      skipped++;
      return;
    }

    const src = pickRemoteAudio(row);
    if (!src) {
      skipped++;
      return;
    }

    try {
      if (DRY) {
        console.log(`[DRY] would upload: "${title}" <- ${src}`);
        done++;
        return;
      }

      // העלאה כ-video (כך Cloudinary מאפשר MP3)
      const pubId = `${slug(title)}-${String(_id).slice(-6)}`;
      const up = await cloudinary.uploader.upload(src, {
        folder: FOLDER,
        public_id: pubId,
        resource_type: 'video',
        overwrite: true,
        use_filename: true,
        unique_filename: false,
        quality: 'auto',
      });

      const secure = up.secure_url;
      if (!secure) throw new Error('no secure_url from Cloudinary');

      await col.updateOne(
        { _id },
        {
          $set: {
            sampleUrl: secure,
            audioUrl: secure,
            updatedAt: new Date(),
          },
        }
      );

      uploaded++;
      done++;
      console.log(`✓ ${title}  →  ${secure}`);
    } catch (e: any) {
      failed++;
      done++;
      console.error(`✗ ${title}  (${e?.message || e})`);
    }
  }

  async function runQueue() {
    for (const row of rows) {
      while (inFlight >= CONCURRENCY) {
        await new Promise((r) => setTimeout(r, 50));
      }
      inFlight++;
      runOne(row).finally(() => (inFlight--));
    }
    // המתנה לסיום
    while (inFlight > 0) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  await runQueue();
  console.log(
    `\nDone. uploaded=${uploaded}, skipped=${skipped}, failed=${failed}, total=${done}`
  );

  await cli.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
