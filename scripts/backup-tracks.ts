import "dotenv/config";
import { MongoClient } from "mongodb";
import * as fs from "node:fs";

(async () => {
  const MONGO = process.env.MONGODB_URI!;
  const DB = process.env.MONGODB_DB || "maty-music";
  const c = new MongoClient(MONGO);
  await c.connect();
  const col = c.db(DB).collection("tracks");
  const all = await col.find({}).toArray();
  const file = `backups/tracks-backup-${Date.now()}.json`;
  fs.mkdirSync("backups", { recursive: true });
  fs.writeFileSync(file, JSON.stringify(all, null, 2));
  console.log("✅ wrote", file, "docs:", all.length);
  await c.close();
})();
