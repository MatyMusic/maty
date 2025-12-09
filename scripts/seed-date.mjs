// scripts/seed-date.mjs
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "maty-music";
if (!uri) throw new Error("Missing MONGODB_URI");

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const col = db.collection("date_profiles");

// מחיקה של זרעים קודמים
await col.deleteMany({ _seedTag: "dev-seed" });

// צור 24 פרופילים (אפשר לשנות ל-N)
const N = Number(process.env.N || 24);

// (ממחזר את makeProfile מה־API או שים מינימלי כאן)
function rand(a) {
  return a[Math.floor(Math.random() * a.length)];
}
function pad(n) {
  return n < 10 ? `0${n}` : String(n);
}
function birthDateBetween(minAge = 21, maxAge = 45) {
  const y =
    new Date().getFullYear() -
    (minAge + Math.floor(Math.random() * (maxAge - minAge + 1)));
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return `${y}-${pad(m)}-${pad(d)}`;
}
const DIRS = [
  "orthodox",
  "haredi",
  "chasidic",
  "modern",
  "conservative",
  "reform",
  "reconstructionist",
  "secular",
];
const LVL = ["strict", "partial", "none"];
const GOALS = ["serious", "marriage", "friendship"];

const docs = Array.from({ length: N }).map((_, i) => ({
  _seedTag: "dev-seed",
  userId: `seed:${i}:${Math.random().toString(36).slice(2, 8)}`,
  displayName: `משתמש/ת ${i + 1}`,
  birthDate: birthDateBetween(),
  gender: rand(["male", "female"]),
  country: "ישראל",
  city: rand(["ירושלים", "תל אביב", "בית שמש", "בני ברק", "חיפה"]),
  languages: ["עברית", "אנגלית"],
  judaism_direction: rand(DIRS),
  kashrut_level: rand(LVL),
  shabbat_level: rand(LVL),
  tzniut_level: rand(LVL),
  goals: rand(GOALS),
  about_me: "פרופיל דוגמה למטרת בדיקות.",
  avatarUrl: null,
  photos: [],
  membership: {
    tier: rand(["free", "plus", "pro"]),
    active: true,
    since: new Date(),
  },
  updatedAt: new Date(),
  createdAt: new Date(),
}));

await Promise.allSettled([
  col.createIndex({ userId: 1 }, { unique: true }),
  col.createIndex({ judaism_direction: 1 }),
  col.createIndex({ goals: 1 }),
  col.createIndex({ city: 1, country: 1 }),
  col.createIndex({ birthDate: 1 }),
  col.createIndex({ updatedAt: -1 }),
]);

const res = await col.insertMany(docs);
console.log("Inserted:", res.insertedCount);
await client.close();
