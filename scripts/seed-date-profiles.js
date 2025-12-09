/* scripts/seed-date-profiles.js
 * שימוש:
 *   node -r dotenv/config scripts/seed-date-profiles.js 60 --clear dotenv_config_path=.env.local
 */

"use strict";

const { MongoClient } = require("mongodb");
let faker;
try {
  faker = require("@faker-js/faker").faker;
} catch {
  faker = null;
}

function loadEnvManually() {
  // אם לא טעון ע"י -r dotenv/config ננסה לטעון ידנית
  try {
    require("dotenv").config({ path: ".env.local" });
  } catch {}
  try {
    require("dotenv").config();
  } catch {}
}
loadEnvManually();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "maty-music";

if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI");
  process.exit(1);
}

const N = parseInt(process.argv[2] || "40", 10);
const DO_CLEAR = process.argv.includes("--clear");

const DIRECTIONS = [
  "orthodox",
  "haredi",
  "chasidic",
  "modern",
  "conservative",
  "reform",
  "reconstructionist",
  "secular",
];
const LEVELS = ["strict", "partial", "none"];
const GENDERS = ["male", "female", "other"];
const GOALS = ["serious", "marriage", "friendship"];

const CITIES_IL = [
  "ירושלים",
  "תל אביב",
  "בני ברק",
  "חיפה",
  "בית שמש",
  "אשדוד",
  "נתניה",
  "פתח תקווה",
  "אלעד",
  "מודיעין עילית",
];
const COUNTRIES = ["ישראל", "ארה״ב", "קנדה", "בריטניה", "צרפת", "אוסטרליה"];

const LANGS = ["he", "en", "ru", "fr", "es", "yi"];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
function sampleMany(arr, k) {
  const s = new Set();
  while (s.size < k) s.add(rand(arr));
  return Array.from(s);
}

function dateFromAge(age) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function makeName(gender) {
  if (faker) {
    return (
      faker.person.firstName(gender === "male" ? "male" : "female") +
      " " +
      faker.person.lastName()
    );
  }
  const maleFirst = [
    "דוד",
    "משה",
    "יעקב",
    "אהרן",
    "אליעזר",
    "נחום",
    "שלומי",
    "יצחק",
  ];
  const femaleFirst = [
    "שרה",
    "רבקה",
    "רחל",
    "לאה",
    "חיה",
    "רבקה",
    "דינה",
    "מיכל",
  ];
  const last = [
    "כהן",
    "לוי",
    "מזרחי",
    "חדד",
    "פרידמן",
    "גולדשטיין",
    "אזולאי",
    "בן דוד",
  ];
  const f = gender === "male" ? rand(maleFirst) : rand(femaleFirst);
  return f + " " + rand(last);
}

function makeProfile(i) {
  const gender = rand(GENDERS);
  const age = randInt(19, 42);
  const birthDate = dateFromAge(age);
  const city = rand(CITIES_IL);
  const country = rand(COUNTRIES);
  const now = new Date().toISOString();

  return {
    userId: `seed-${Date.now()}-${i}`,
    email: `seed${i}@maty.example`,
    displayName: makeName(gender),
    birthDate,
    gender,
    country,
    city,
    languages: sampleMany(LANGS, randInt(1, 3)),
    jewish_by_mother: Math.random() < 0.9,
    conversion: Math.random() < 0.08,
    judaism_direction: rand(DIRECTIONS),
    kashrut_level: rand(LEVELS),
    shabbat_level: rand(LEVELS),
    tzniut_level: rand(LEVELS),
    goals: rand(GOALS),
    about_me: "פרופיל דמו למטרות בדיקה של MATY-DATE.",
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  };
}

(async () => {
  const cli = new MongoClient(MONGODB_URI);
  await cli.connect();
  const db = cli.db(DB_NAME);
  const C = db.collection("date_profiles");

  console.log(`➡️  Connected. DB: ${DB_NAME}, collection: date_profiles`);
  if (DO_CLEAR) {
    const del = await C.deleteMany({ userId: /^seed-/ });
    console.log(`🧹 Cleared seed docs: ${del.deletedCount}`);
  }

  // אינדקסים בטוחים (אם קיימים — יתעדכן לפי השם)
  try {
    await C.createIndexes([
      { key: { userId: 1 }, name: "userId_uniq", unique: true },
      { key: { updatedAt: -1, _id: -1 }, name: "updated_desc_id_desc" },
      {
        key: {
          country: 1,
          city: 1,
          judaism_direction: 1,
          gender: 1,
          goals: 1,
          birthDate: 1,
          updatedAt: -1,
          _id: -1,
        },
        name: "match_filters_composite",
      },
    ]);
  } catch (e) {
    console.warn("⚠️ index ensure warning:", e.message);
  }

  const docs = Array.from({ length: N }, (_, i) => makeProfile(i));
  const res = await C.insertMany(docs, { ordered: false }).catch(
    async (err) => {
      // אם יש התנגשות יוניק — ננסה להכניס רק את החדשים
      console.warn("insertMany warning:", err?.message);
      let ok = 0;
      for (const d of docs) {
        try {
          await C.insertOne(d);
          ok++;
        } catch {
          /* ignore */
        }
      }
      return { insertedCount: ok };
    }
  );

  console.log(`✅ Seeded ${res.insertedCount || docs.length} profiles`);
  await cli.close();
  process.exit(0);
})().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
