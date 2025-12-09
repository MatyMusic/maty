// src/scripts/verify-audio-urls.ts
import "dotenv/config";
import { getNigunimDb } from "@/lib/db-nigunim";
import { probeAudioUrl } from "@/lib/net";

/**
 * עובר על nigun_audio ובודק כל audioUrl:
 * - אם שבור: מסמן broken:true (או מוחק, לבחירתך).
 * - אם עובד: עדכון lastCheckedAt.
 */
const DELETE_BROKEN = false; // שנה ל-true אם אתה רוצה למחוק שורות שבורות

async function main() {
  const db = await getNigunimDb();
  const col = db.collection("nigun_audio");

  const cursor = col.find(
    {},
    { projection: { _id: 1, audioUrl: 1, title: 1, artist: 1 } },
  );
  let okCount = 0,
    brokenCount = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const url = doc?.audioUrl;
    if (!url) continue;

    const probe = await probeAudioUrl(url);
    if (probe.ok && probe.playable) {
      okCount++;
      await col.updateOne(
        { _id: doc._id },
        { $set: { lastCheckedAt: new Date(), broken: false } },
      );
    } else {
      brokenCount++;
      if (DELETE_BROKEN) {
        await col.deleteOne({ _id: doc._id });
        console.log("✗ deleted broken:", doc.title, url);
      } else {
        await col.updateOne(
          { _id: doc._id },
          { $set: { broken: true, lastCheckedAt: new Date() } },
        );
        console.log("✗ marked broken:", doc.title, url);
      }
    }
  }

  console.log(`✓ verify done. ok=${okCount}, broken=${brokenCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
