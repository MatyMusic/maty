/* eslint-disable no-console */
import "dotenv/config";
import "tsconfig-paths/register";
import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import clientPromise from "@/lib/mongodb";

async function main() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NIGUNIM || "maty-nigunim");
  const col = db.collection("nigunim");

  const rows: any[] = [];
  await new Promise<void>((resolve, reject) => {
    createReadStream("nigun-bulk-import.csv")
      .pipe(parse({ columns: true, bom: true, trim: true }))
      .on("data", (r) => rows.push(r))
      .on("end", () => resolve())
      .on("error", reject);
  });

  for (const r of rows) {
    const doc: any = {
      title: r.title,
      altTitles: (r.alt_titles || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      tags: (r.tags || "")
        .split(",")
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean),
      cat: (r.category || "chabad").toLowerCase(),
      cover: r.cover_url || null,
      sourceType: (r.source_provider || "").toLowerCase(),
      sourceUrl: r.source_url || null,
      audioUrl:
        r.source_provider === "mp3" || r.source_provider === "cloudinary"
          ? r.source_url
          : null,
      license: (r.rights_status || "unknown").toLowerCase(),
      creditedTo: r.credited_to || null,
      durationSec: Number(r.tempo_bpm) ? null : null, // אופציונלי: להשאיר ל-enrichment
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await col.updateOne({ title: doc.title }, { $set: doc }, { upsert: true });
  }

  console.log("✓ import done:", rows.length);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
