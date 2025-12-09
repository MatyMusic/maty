import "dotenv/config";
import { MongoClient } from "mongodb";

declare global { var _ensureAdminClient: Promise<MongoClient> | undefined; }

async function getClient() {
  const uri = process.env.MONGODB_URI!;
  if (!uri) throw new Error("Missing MONGODB_URI");
  const client = new MongoClient(uri);
  const p = global._ensureAdminClient ?? client.connect();
  if (process.env.NODE_ENV !== "production") global._ensureAdminClient = p;
  return p;
}

async function main() {
  const client = await getClient();
  const db = client.db();
  const users = db.collection("users");
  const email = process.env.ADMIN_EMAIL || "admin@example.com";

  const existing = await users.findOne({ email });
  if (existing) {
    console.log("[ensure-admin] exists:", email);
    return;
  }
  await users.insertOne({ email, role: "admin", createdAt: new Date() });
  console.log("[ensure-admin] created admin:", email);
}

main().catch((e) => { console.error(e); process.exit(1); });
