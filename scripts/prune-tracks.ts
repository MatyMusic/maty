// scripts/prune-tracks.ts
// מנקה הרצאות/שיעורים/מקורות לא רצויים ופריטים בלתי ניתנים לניגון.
// ברירת מחדל DRY-RUN. הוסיפו --apply כדי לבצע מחיקה בפועל.
// פרמטרים: --apply --maxDuration 1800

import "dotenv/config";
import { MongoClient, Filter } from "mongodb";

const MONGO = process.env.MONGODB_URI!;
const DB = process.env.MONGODB_DB || "maty-music";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const maxDurArg = Math.max(
  1,
  parseInt(argv[argv.indexOf("--maxDuration") + 1] || "1800", 10),
); // 30 ד'
const MAX_DURATION = Number.isFinite(maxDurArg) ? maxDurArg : 1800;

const ALLOWED_TAGS = new Set([
  "chabad",
  "carlebach",
  "breslov",
  "nichoach",
  "russian",
  "klezmer",
  "jewish",
]);

const lectureRx = new RegExp(
  "(שיעור|שיעורי|דרשה|הרצאה|תורה|פרשה|הלכה|הלכות|שיחה|התוועדות|מדרש|ספר|תניא|גמרא|פלפול|Shiur|Torah|Lecture|Parsha|Halacha)",
  "i",
);
const badChannelsRx =
  /(chabad\.?info|chabad info|חדשות חב|ch10|radio|podcast|daily daf|daf yomi)/i;

function or<T>(...conds: Filter<T>[]): Filter<T> {
  return { $or: conds } as any;
}
function nor<T>(...conds: Filter<T>[]): Filter<T> {
  return { $nor: conds } as any;
}

(async () => {
  const c = new MongoClient(MONGO);
  await c.connect();
  const col = c.db(DB).collection("tracks");

  // 1) פריטים "לא ניתנים לניגון" – אין שום מקור נגן
  const fUnplayable: Filter<any> = {
    $and: [
      { $or: [{ playable: false }, { playable: { $exists: false } }] },
      nor(
        { audioUrl: { $exists: true, $ne: "" } },
        { previewUrl: { $exists: true, $ne: "" } },
        { embedUrl: { $exists: true, $ne: "" } },
        { videoId: { $exists: true, $ne: "" } },
      ),
    ],
  };

  // 2) שיעורים/הרצאות לפי טקסט בכותרת/תיאור
  const fLectures: Filter<any> = or<any>(
    { title: { $regex: lectureRx } },
    { description: { $regex: lectureRx } },
  );

  // 3) ערוצים לא רצויים (למשל chabad.info)
  const fBadChannels: Filter<any> = { channelTitle: { $regex: badChannelsRx } };

  // 4) מסנני משך (מאוד ארוך -> כנראה לא שיר). אפשר לשנות עם --maxDuration
  const fTooLong: Filter<any> = { durationSec: { $gt: MAX_DURATION } };

  // 5) לא שייך לקטגוריות שלנו כלל (ללא overlap עם ALLOWED_TAGS)
  const fNotOurTags: Filter<any> = {
    $or: [
      { categories: { $exists: false } },
      { categories: { $size: 0 } },
      { categories: { $nin: Array.from(ALLOWED_TAGS) } },
    ],
  };

  // ---- הרצה ב-DRY RUN קודם ----
  async function report(name: string, filter: Filter<any>) {
    const n = await col.countDocuments(filter);
    console.log(`${APPLY ? "🗑️" : "🔎"} ${name}: ${n}`);
    if (APPLY && n) {
      const res = await col.deleteMany(filter);
      console.log(`   ➜ deleted: ${res.deletedCount}`);
    }
  }

  console.log(
    "▶ prune (",
    APPLY ? "APPLY" : "DRY-RUN",
    ", maxDuration=",
    MAX_DURATION,
    "sec )",
  );

  await report("Unplayable (no audio/preview/embed/videoId)", fUnplayable);
  await report("Lectures/Torah (title/description)", fLectures);
  await report("Unwanted channels (e.g., chabad.info)", fBadChannels);
  await report(`Too long (> ${MAX_DURATION}s)`, fTooLong);
  await report("Not in our tags", fNotOurTags);

  console.log("✅ done.");
  await c.close();
})().catch((e) => {
  console.error("❌ ERROR:", e.message || e);
  process.exit(1);
});
