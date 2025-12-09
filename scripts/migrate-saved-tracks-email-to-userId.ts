// scripts/migrate-saved-tracks-email-to-userId.ts
import { getCollection } from "@/lib/db";

async function run() {
  const users = await getCollection<any>("users");
  const saved = await getCollection<any>("saved_tracks");

  const cursor = saved.find({
    userId: { $exists: false },
    userEmail: { $exists: true },
  });
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const u = await users.findOne({ email: doc.userEmail });
    if (u?.userId) {
      await saved.updateOne(
        { _id: doc._id },
        { $set: { userId: u.userId }, $unset: { userEmail: "" } }
      );
    }
  }

  await saved.createIndex({ userId: 1, createdAt: -1 });
}

run().then(() => process.exit(0));
