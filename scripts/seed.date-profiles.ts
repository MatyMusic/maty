/* eslint-disable no-console */
import "dotenv/config";
import clientPromise from "@/lib/mongodb";

type Direction =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular";

type Gender = "male" | "female" | "other";

function point(lng: number, lat: number) {
  return { type: "Point", coordinates: [lng, lat] as [number, number] };
}

const CITY = {
  jerusalem: { city: "Jerusalem", country: "IL", loc: point(35.2137, 31.7683) },
  bneiBrak: { city: "Bnei Brak", country: "IL", loc: point(34.8339, 32.0871) },
  telAviv: { city: "Tel Aviv", country: "IL", loc: point(34.7818, 32.0853) },
};

const SEED = [
  {
    userId: "seed-yoel",
    displayName: "יואל",
    gender: "male",
    judaism_direction: "chassidic",
    birthDate: "1993-06-14",
    ...CITY.jerusalem,
  },
  {
    userId: "seed-ella",
    displayName: "אלה חיה",
    gender: "female",
    judaism_direction: "orthodox",
    birthDate: "1998-04-02",
    ...CITY.telAviv,
  },
  {
    userId: "seed-malka",
    displayName: "מלכה",
    gender: "female",
    judaism_direction: "haredi",
    birthDate: "1995-12-21",
    ...CITY.bneiBrak,
  },
  {
    userId: "seed-dovid",
    displayName: "דוד",
    gender: "male",
    judaism_direction: "chassidic",
    birthDate: "1990-10-01",
    ...CITY.bneiBrak,
  },
  {
    userId: "seed-mendy",
    displayName: "מנדי",
    gender: "male",
    judaism_direction: "chassidic",
    birthDate: "1996-02-11",
    ...CITY.telAviv,
  },
  {
    userId: "seed-rivka",
    displayName: "רבקה",
    gender: "female",
    judaism_direction: "modern",
    birthDate: "1999-09-09",
    ...CITY.jerusalem,
  },
  {
    userId: "seed-sara",
    displayName: "שרה",
    gender: "female",
    judaism_direction: "chassidic",
    birthDate: "1997-01-30",
    ...CITY.telAviv,
  },
  {
    userId: "seed-levi",
    displayName: "לוי",
    gender: "male",
    judaism_direction: "orthodox",
    birthDate: "1992-07-07",
    ...CITY.jerusalem,
  },
] as Array<{
  userId: string;
  displayName: string;
  gender: Gender;
  judaism_direction: Direction;
  birthDate: string;
  city: string;
  country: string;
  loc: { type: "Point"; coordinates: [number, number] };
}>;

async function main() {
  const cli = await clientPromise;
  const db = cli.db(process.env.MONGODB_DB || "maty-music");
  const profiles = db.collection("date_profiles");

  // אינדקסים
  await profiles.createIndex({ userId: 1 }, { unique: true });
  await profiles.createIndex({ loc: "2dsphere" });

  // הזרקה עדינה: upsert לפי userId
  for (const row of SEED) {
    await profiles.updateOne(
      { userId: row.userId },
      {
        $set: {
          displayName: row.displayName,
          gender: row.gender,
          judaism_direction: row.judaism_direction,
          birthDate: row.birthDate,
          city: row.city,
          country: row.country,
          loc: row.loc,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
          avatarUrl: null,
          photos: [],
        },
      },
      { upsert: true }
    );
    console.log("seeded:", row.userId, row.displayName, "→", row.city);
  }

  console.log("DONE.");
  await cli.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
