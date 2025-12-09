import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import nigunClientPromise from "@/lib/mongo-nigunim";

const CLOUD =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME;
const PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
  process.env.CLOUDINARY_UPLOAD_PRESET;
const FOLDER = process.env.CLOUDINARY_FOLDER || "maty/nigunim/audio";

if (!CLOUD || !PRESET) {
  console.error("❌ Missing Cloudinary env (CLOUD / PRESET). בדוק .env.local");
  process.exit(1);
}

function arg(name: string, def?: string) {
  const i = process.argv.indexOf(name);
  return i === -1 ? def : process.argv[i + 1];
}
const DIR = path.resolve(process.cwd(), arg("--dir", "assets/nigunim-audio"));
const LIMIT = Number(arg("--limit", "1000")!);
const DRY = process.argv.includes("--dry");

const MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
};

function toDataUrl(buf: Buffer, ext: string) {
  const mime = MIME[ext.toLowerCase()] || "audio/mpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function cloudSampleUrl(publicId: string) {
  // טרנספורם של 30ש׳
  return `https://res.cloudinary.com/${CLOUD}/video/upload/du_30/${publicId}.mp3`;
}

async function uploadAudio(dataUrl: string, publicId: string) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD}/video/upload`;
  const body = new URLSearchParams();
  body.set("file", dataUrl);
  body.set("upload_preset", PRESET!);
  body.set("public_id", `${FOLDER}/${publicId}`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const j = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(j?.error?.message || JSON.stringify(j));
  return { url: j.secure_url as string, public_id: j.public_id as string };
}

async function main() {
  console.log(`🎧 Attach audio from: ${DIR} (limit=${LIMIT}) dry=${DRY}`);
  const client = await nigunClientPromise;
  const db = client.db(process.env.MONGODB_DB_NIGUNIM || "maty-nigunim");
  const col = db.collection("nigunim");

  const files = (await fs.readdir(DIR))
    .filter((f) => /\.(mp3|m4a|aac|ogg|wav)$/i.test(f))
    .slice(0, LIMIT);
  let ok = 0,
    miss = 0,
    up = 0,
    fail = 0;

  for (const file of files) {
    const ext = path.extname(file);
    const slug = path.basename(file, ext);
    process.stdout.write(`• ${slug} ... `);

    const doc = await col.findOne({ slug });
    if (!doc) {
      console.log("אין במסד");
      miss++;
      continue;
    }

    try {
      const buf = await fs.readFile(path.join(DIR, file));
      const dataUrl = toDataUrl(buf, ext);
      let audioUrl = doc.audioUrl as string | undefined;
      let publicId = doc.cloudinaryId as string | undefined;

      if (!DRY) {
        const uploaded = await uploadAudio(dataUrl, slug);
        audioUrl = uploaded.url;
        publicId = uploaded.public_id;
        up++;
      }

      const $set: any = {
        audioUrl,
        cloudinaryId: publicId,
        sampleUrl: publicId ? cloudSampleUrl(publicId) : undefined,
        updatedAt: new Date(),
      };

      if (!DRY) await col.updateOne({ _id: doc._id }, { $set });
      console.log("OK");
      ok++;
    } catch (e: any) {
      console.log("FAIL:", e?.message || e);
      fail++;
    }
  }

  console.log(
    `\nDone. files=${files.length} ok=${ok} uploaded=${up} miss=${miss} fail=${fail}`
  );
}

main().catch((e) => {
  console.error("❌ attach-audio failed:", e?.message || e);
  process.exit(1);
});
