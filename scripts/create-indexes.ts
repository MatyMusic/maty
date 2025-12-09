import "dotenv/config";
import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_NIGUNIM;
  if (!uri) throw new Error("Missing MONGODB_URI");
  const dbName = process.env.MONGODB_DB_NIGUNIM || "maty-nigunim";

  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(dbName).collection("nigunim");

  await col.createIndex(
    { normTitle: 1 },
    { unique: true, name: "uniq_normTitle" }
  );
  await col.createIndex({ updatedAt: -1 }, { name: "byUpdated" });
  await col.createIndex({ tags: 1 }, { name: "byTags" });
  await col.createIndex({ mood: 1 }, { name: "byMood" });
  await col.createIndex({ tempo: 1 }, { name: "byTempo" });
  await col.createIndex({ bpm: 1 }, { name: "byBpm" });

  console.log("Indexes created ✅");
  await client.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
