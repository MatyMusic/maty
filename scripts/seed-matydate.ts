// scripts/seed-matydate.ts
// Usage: ts-node scripts/seed-matydate.ts
// or:    node -r ts-node/register scripts/seed-matydate.ts
// Env:   MONGO_URL="mongodb://localhost:27017/matydate"

import { MongoClient } from "mongodb";

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/matydate";
const DB_NAME = MONGO_URL.split("/").pop() || "matydate";
const COLL = "date_profiles";

type Tier = "free" | "plus" | "pro" | "vip";
type SubStatus = "active" | "inactive";

function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function bool(p = 0.5) {
  return Math.random() < p;
}
function age() {
  return Math.floor(22 + Math.random() * 20);
}

const cities = [
  "ירושלים",
  "תל אביב",
  "חיפה",
  "בית שמש",
  "מודיעין",
  "לונדון",
  "ניו יורק",
  "פריז",
];
const countries = ["ישראל", "ארה״ב", "בריטניה", "צרפת"];
const directions = [
  "orthodox",
  "modern",
  "haredi",
  "conservative",
  "reform",
  "secular",
] as const;
const goals = ["serious", "marriage", "friendship"] as const;
const genders = ["male", "female"] as const;
const names = [
  "מתי",
  "יעל",
  "נועם",
  "דניאל",
  "אורי",
  "תמר",
  "שירה",
  "אופיר",
  "אור",
  "איילה",
  "רועי",
  "עדי",
  "Levi",
  "Rachel",
  "David",
  "Sara",
  "Yosef",
  "Miriam",
];
const tiers: Tier[] = ["free", "plus", "pro", "vip"];

function makeUser(i: number) {
  const t = rand(tiers);
  const active: SubStatus = bool(0.75) ? "active" : "inactive";
  const photos = bool(0.7)
    ? [`https://picsum.photos/seed/maty${i}/400/300`]
    : [];
  return {
    userId: `u_${i}`,
    displayName: rand(names),
    age: age(),
    gender: rand(genders),
    city: rand(cities),
    country: rand(countries),
    direction: rand([...directions]),
    goals: rand([...goals]),
    photos,
    avatarUrl: photos[0],
    about_me:
      "אוהב/ת קהילה, תרבות, ושבתות עם חברים. מחפש/ת חיבור אמיתי וערכים משותפים.",
    verified: bool(0.6),
    online: bool(0.5),
    subscription: {
      status: active,
      tier: t,
      expiresAt:
        active === "active"
          ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
          : undefined,
    },
    score: Math.floor(70 + Math.random() * 30),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection(COLL);

  // optional: clear old demo docs
  await col.deleteMany({ userId: { $regex: /^u_/ } });

  const docs = Array.from({ length: 24 }, (_, i) => makeUser(i + 1));
  const { insertedCount } = await col.insertMany(docs as any);
  console.log(
    `Inserted ${insertedCount} demo profiles into ${DB_NAME}.${COLL}`
  );

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
