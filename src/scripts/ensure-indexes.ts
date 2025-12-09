// src/scripts/ensure-indexes.ts
import "dotenv/config";
import { getNigunimDb } from "@/lib/db-nigunim";

async function main() {
  const db = await getNigunimDb();
  await db.collection("nigun_audio").createIndex({ updatedAt: -1, _id: -1 });
  await db
    .collection("nigun_audio")
    .createIndex({ title: "text", artist: "text", album: "text" });
  await db.collection("nigun_audio").createIndex({ tags: 1, origin: 1 });

  await db.collection("nigun_embed").createIndex({ updatedAt: -1, _id: -1 });
  await db.collection("nigun_embed").createIndex({ title: "text" });
  await db.collection("nigun_embed").createIndex({ tags: 1, origin: 1 });

  console.log("✓ indexes created");
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
