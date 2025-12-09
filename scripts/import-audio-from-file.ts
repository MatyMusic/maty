// scripts/import-audio-from-file.ts
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";
import { v2 as cloudinary } from "cloudinary";

type Row = {
  title?: string;
  id?: string;
  url?: string;
  cover?: string;
  mood?: string;
  tempo?: "slow" | "mid" | "fast";
  bpm?: number;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string | boolean> = {
    mode: "link",
    concurrency: "4",
    folder: "maty-music",
    field: "title",
  };
  for (const a of args) {
    const m = /^--([^=]+)(=(.*))?$/.exec(a);
    if (m) opts[m[1]] = m[3] ?? true;
  }
  if (!opts.file) throw new Error("Missing --file=audio-import.jsonl|.csv");
  return opts as any as {
    file: string;
    mode: "link" | "upload";
    folder: string;
    concurrency: string;
    field: "title" | "id";
    dry?: boolean;
  };
}

// robust CSV line parser (handles quotes)
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (c === "," && !q) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

async function readRows(file: string): Promise<Row[]> {
  const ext = path.extname(file).toLowerCase();
  const raw = fs.readFileSync(file, "utf8");
  if (ext === ".json") {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) throw new Error("JSON must be an array");
    return arr;
  }
  if (ext === ".jsonl" || ext === ".ndjson") {
    return raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  }
  if (ext === ".csv") {
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const head = parseCsvLine(lines[0]);
    const idxTitle = head.findIndex((h) => /^(title|name)$/i.test(h));
    const idxUrl = head.findIndex((h) => /^url$/i.test(h));
    const idxId = head.findIndex((h) => /^id$/i.test(h));
    if (idxUrl < 0 || (idxTitle < 0 && idxId < 0))
      throw new Error("CSV must have columns: url and title or id");
    const rows: Row[] = [];
    for (let i = 1; i < lines.length; i++) {
      const c = parseCsvLine(lines[i]);
      rows.push({
        title: idxTitle >= 0 ? c[idxTitle] : undefined,
        id: idxId >= 0 ? c[idxId] : undefined,
        url: c[idxUrl],
      });
    }
    return rows;
  }
  throw new Error("Unsupported file type. Use .json/.jsonl/.csv");
}

function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 150);
}

async function main() {
  const { file, mode, folder, concurrency, field, dry } = parseArgs();
  require("dotenv").config({ path: ".env.local" });

  const MONGO_URI = process.env.MONGODB_URI_NIGUNIM || process.env.MONGODB_URI;
  const MONGO_DB =
    process.env.MONGODB_DB_NIGUNIM || process.env.MONGODB_DB || "maty-nigunim";
  if (!MONGO_URI) throw new Error("Missing MONGODB_URI_NIGUNIM/MONGODB_URI");

  if (mode === "upload") {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env as any;
    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      throw new Error("Cloudinary creds missing");
    }
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
  }

  const rows = (await readRows(file)).filter(
    (r) => r.url && (r.title || r.id)
  ) as Row[];
  console.log(
    `Found ${rows.length} rows in ${path.basename(
      file
    )} (mode=${mode}, field=${field})`
  );

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const col = client.db(MONGO_DB).collection("nigunim");

  let ok = 0,
    up = 0,
    miss = 0,
    fail = 0;
  const pool = Number(concurrency) || 4;
  const queue = rows.slice();
  const run = async (row: Row) => {
    try {
      const q: any =
        field === "id" && row.id
          ? { _id: new (require("mongodb").ObjectId)(row.id) }
          : { $or: [{ title: row.title }, { altTitles: row.title }] };

      const doc = await col.findOne(q, { projection: { _id: 1, title: 1 } });
      if (!doc) {
        miss++;
        console.log(`⚠️  not found: ${row.title || row.id}`);
        return;
      }

      let finalUrl = row.url!;
      if (mode === "upload") {
        const public_id = slugify(`${doc.title || row.title}`);
        const res = await cloudinary.uploader.upload(row.url!, {
          resource_type: "video",
          folder,
          public_id,
          overwrite: true,
        });
        finalUrl = res.secure_url;
        up++;
      }

      if (dry) {
        ok++;
        console.log(
          `(dry) would set sampleUrl for "${doc.title}" -> ${finalUrl}`
        );
        return;
      }

      await col.updateOne({ _id: doc._id }, { $set: { sampleUrl: finalUrl } });
      ok++;
      if (ok % 50 === 0)
        console.log(
          `✅ updated ${ok} (uploaded ${up}, missing ${miss}, failed ${fail})`
        );
    } catch (e: any) {
      fail++;
      console.error(`❌ ${row.title || row.id}: ${e.message || e}`);
    }
  };

  const workers: Promise<void>[] = [];
  for (let i = 0; i < pool; i++) {
    workers.push(
      (async function loop() {
        while (queue.length) {
          const row = queue.shift()!;
          await run(row);
        }
      })()
    );
  }
  await Promise.all(workers);
  await client.close();

  console.log(
    `\nDone. updated=${ok}, uploaded=${up}, missing=${miss}, failed=${fail}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
