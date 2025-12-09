// src/tools/ensure-auth-indexes.ts (סקריפט ריצה ידנית)
import { getDb } from "@/lib/mongo";
(async () => {
  const db = await getDb(process.env.MONGODB_DB || "matymusic");
  await db
    .collection("users")
    .createIndex({ email: 1 }, { unique: true, sparse: true });
  await db
    .collection("accounts")
    .createIndex({ provider: 1, providerAccountId: 1 }, { unique: true });
  await db
    .collection("sessions")
    .createIndex({ sessionToken: 1 }, { unique: true });
  console.log("Indexes OK");
  process.exit(0);
})();
