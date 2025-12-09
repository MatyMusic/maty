// scripts/import-ia.ts
import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGO = process.env.MONGODB_URI!;
const DB = process.env.MONGODB_DB || "maty-music";
if (!MONGO) throw new Error("Missing MONGODB_URI");

// שאילתות בסיס (הרחב לפי הצורך)
const QUERIES = ["chabad nigun", "breslov nigun", "jewish nigun", 'חב"ד ניגון'];

async function iaSearch(q: string, rows = 1000) {
  const url = new URL("https://archive.org/advancedsearch.php");
  url.searchParams.set("q", q);
  url.searchParams.set("output", "json");
  url.searchParams.set("rows", String(rows));
  url.searchParams.set("fl[]", "identifier");
  const res = await fetch(url);
  const js = await res.json();
  const ids: string[] = (js?.response?.docs || []).map(
    (d: any) => d.identifier,
  );
  return ids;
}

async function iaItem(identifier: string) {
  const url = `https://archive.org/metadata/${identifier}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

(async function main() {
  const cli = new MongoClient(MONGO);
  await cli.connect();
  const col = cli.db(DB).collection("tracks");
  let total = 0;

  for (const q of QUERIES) {
    console.log("▶ IA:", q);
    const ids = await iaSearch(q, 1000);
    for (const id of ids) {
      const meta = await iaItem(id);
      if (!meta) continue;
      const files = meta?.files || [];
      const mp3 = files.find((f: any) =>
        String(f?.name || "")
          .toLowerCase()
          .endsWith(".mp3"),
      );
      if (!mp3) continue;

      const audioUrl = `https://archive.org/download/${id}/${encodeURIComponent(mp3.name)}`;
      const now = new Date();
      const doc = {
        _id: `ia:${id}`,
        source: "ia" as const,
        title: meta?.metadata?.title || id,
        description: meta?.metadata?.description || "",
        audioUrl,
        cover: `https://archive.org/services/img/${id}`,
        durationSec: mp3?.length
          ? Math.round(parseFloat(mp3.length))
          : undefined,
        tags: ["archive"],
        categories: [],
        playable: true,
        updatedAt: now,
      };

      const res = await col.updateOne(
        { _id: doc._id },
        { $set: doc, $setOnInsert: { createdAt: now } },
        { upsert: true },
      );
      total += res.upsertedCount + res.modifiedCount;
    }
  }

  console.log("TOTAL:", total);
  await cli.close();
})();
