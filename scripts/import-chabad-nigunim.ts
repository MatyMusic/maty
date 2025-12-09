// scripts/import-chabad-nigunim.ts
import "dotenv/config";
import { parse } from "csv-parse";
import { createReadStream } from "node:fs";
import fetch from "node-fetch";
import clientPromise from "@/lib/mongodb";

async function validateUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NIGUNIM || "nigunim");

  const rows: any[] = [];
  await new Promise<void>((res, rej) => {
    createReadStream("chabad-nigunim.csv")
      .pipe(parse({ columns: true, bom: true, trim: true }))
      .on("data", (r) => rows.push(r))
      .on("end", res)
      .on("error", rej);
  });

  for (const r of rows) {
    const url = r.source_url;
    const exists = url ? await validateUrl(url) : false;
    if (!exists) {
      console.warn("URL not valid, skipping:", r.title, url);
      continue;
    }
    const doc = {
      title: r.title,
      album: r.album || null,
      sourceProvider: r.provider,
      audioUrl: url,
      rights: "downloadable",
      createdAt: new Date(),
    };
    await db
      .collection("nigunim")
      .updateOne(
        { title: doc.title, album: doc.album },
        { $set: doc },
        { upsert: true },
      );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
