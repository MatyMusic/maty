import "dotenv/config";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { MongoClient, BulkWriteOperation } from "mongodb";

type Tempo = "slow" | "mid" | "fast";

function normTitle(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[״"׳'`]/g, "")
    .replace(/[()[\]{}.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function splitish(s?: string) {
  return String(s ?? "")
    .split(/[|,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}
function tempoify(s?: string): Tempo | undefined {
  const t = String(s || "").toLowerCase();
  return t === "slow" || t === "mid" || t === "fast" ? t : undefined;
}
function intish(s?: string) {
  const n = parseInt(String(s ?? "").trim(), 10);
  return Number.isFinite(n) ? n : undefined;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run import:nigun-csv -- data/nigunim.csv");
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    console.error("CSV not found:", file);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_NIGUNIM;
  if (!uri) throw new Error("Missing MONGODB_URI");
  const dbName = process.env.MONGODB_DB_NIGUNIM || "maty-nigunim";

  const text = fs.readFileSync(file, "utf8");
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;
  console.log(`Parsed ${rows.length} rows from ${file}`);

  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(dbName).collection("nigunim");

  const BATCH = 1000;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, Math.min(i + BATCH, rows.length));

    const ops: BulkWriteOperation<any>[] = chunk.map((r) => {
      const title = (r.title || "").trim();
      if (!title)
        return {
          updateOne: {
            filter: { _id: `skip_${Math.random()}` },
            update: { $set: {} },
            upsert: false,
          },
        } as any;

      const norm = normTitle(title);
      const artists = splitish(r.artists);
      const tags = splitish(r.tags);
      const mood = r.mood?.trim() || undefined;
      const tempo = tempoify(r.tempo);
      const bpm = intish(r.bpm);
      const cover = r.cover?.trim() || undefined;
      const category = r.category?.trim() || undefined;

      const audioUrl = r.audioUrl?.trim() || undefined;
      const sampleUrl = audioUrl || r.sampleUrl?.trim() || undefined;
      const videoUrl = r.videoUrl?.trim() || undefined;
      const externalUrl = r.externalUrl?.trim() || undefined;

      const sourceRaw = (r.source || "").trim().toLowerCase();
      const source: "nigunim" | "local" | "youtube" | "spotify" =
        sourceRaw === "youtube"
          ? "youtube"
          : sourceRaw === "spotify"
          ? "spotify"
          : sourceRaw === "local"
          ? "local"
          : "nigunim";

      const set: any = {
        title,
        normTitle: norm,
        source,
        updatedAt: new Date(),
      };
      if (artists.length) set.artists = artists;
      if (tags.length) set.tags = tags;
      if (mood) set.mood = mood;
      if (tempo) set.tempo = tempo;
      if (typeof bpm === "number") set.bpm = bpm;
      if (cover) set.cover = cover;
      if (category) set.category = category;
      if (sampleUrl) set.sampleUrl = sampleUrl;
      if (audioUrl) set.audioUrl = audioUrl;
      if (videoUrl) set.videoUrl = videoUrl;
      if (externalUrl) set.externalUrl = externalUrl;

      return {
        updateOne: {
          filter: { normTitle: norm },
          update: { $setOnInsert: { createdAt: new Date() }, $set: set },
          upsert: true,
        },
      };
    });

    const res = await col.bulkWrite(ops, { ordered: false });
    console.log(
      `Chunk ${i}-${i + chunk.length - 1}: inserted=${
        res.upsertedCount
      } modified=${res.modifiedCount} matched=${res.matchedCount}`
    );
  }

  console.log("Done ✅");
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
