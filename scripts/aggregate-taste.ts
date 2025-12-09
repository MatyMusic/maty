/* eslint-disable no-console */
import "dotenv/config";
import "tsconfig-paths/register";
import clientPromise from "@/lib/mongodb";
import TasteVector from "@/models/TasteVector";

// משקולת לתגיות/אמנים לפי סוג אירוע:
const WEIGHTS = { start: 1, heartbeat: 2, stop: 0 };

async function main() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB as string);

  // שלוף אירועי השמעה אחרונים (למשל 7 ימים)
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const events = db.collection("music_play_events");
  const tracks = db.collection("tracks"); // או "songs" — תלוי איפה אתה שומר תגיות/אמנים

  // ממפים userId -> מונה תגיות/אמנים
  const tagBuckets = new Map<string, Map<string, number>>();
  const artistBuckets = new Map<string, Map<string, number>>();

  const cursor = events.find({
    at: { $gte: since },
    type: { $in: ["start", "heartbeat"] },
    userId: { $ne: null },
  });
  for await (const ev of cursor) {
    const userId = String(ev.userId);
    const t = await tracks.findOne({ _id: ev.trackId }); // אם שמרת כ־ObjectId – המר בהתאם
    if (!t) continue;
    const weight = WEIGHTS[ev.type as keyof typeof WEIGHTS] ?? 1;

    // תגיות
    const tags: string[] = (t.tags || []).map((x: string) =>
      String(x).toLowerCase(),
    );
    if (tags.length) {
      if (!tagBuckets.has(userId)) tagBuckets.set(userId, new Map());
      const bucket = tagBuckets.get(userId)!;
      for (const tag of tags) bucket.set(tag, (bucket.get(tag) || 0) + weight);
    }

    // אמנים
    const artist = (t.artist || "").trim();
    if (artist) {
      if (!artistBuckets.has(userId)) artistBuckets.set(userId, new Map());
      const ab = artistBuckets.get(userId)!;
      ab.set(artist, (ab.get(artist) || 0) + weight);
    }
  }

  // כתיבה ל-TasteVector
  for (const [userId, bucket] of tagBuckets) {
    const tagsObj: Record<string, number> = {};
    [...bucket.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => (tagsObj[k] = v));
    const topArtists = [...(artistBuckets.get(userId)?.entries() || [])]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k]) => k);

    await TasteVector.updateOne(
      { userId },
      { $set: { tags: tagsObj, topArtists, lastUpdatedAt: new Date() } },
      { upsert: true },
    );
  }

  console.log("✓ aggregate-taste done");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
