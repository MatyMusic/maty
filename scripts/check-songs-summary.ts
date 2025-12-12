// scripts/check-songs-summary.ts
import "dotenv/config";
import { getCollection } from "../src/lib/db/mongo";

async function run() {
  const col = await getCollection("songs");

  const total = await col.countDocuments({});
  console.log("Total songs in DB:", total);

  const sample = await col
    .find({})
    .project({ title: 1, artist: 1, album: 1, coverUrl: 1, slug: 1 })
    .limit(5)
    .toArray();

  console.log("Sample (first 5):");
  for (const s of sample) {
    console.log(
      `- ${s.title} — ${s.artist} | album: ${s.album} | cover: ${s.coverUrl ? "YES" : "NO"} | slug: ${s.slug}`,
    );
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("CHECK ERROR:", err);
  process.exit(1);
});
