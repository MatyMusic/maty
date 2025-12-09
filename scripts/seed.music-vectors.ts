// scripts/seed.music-vectors.ts
/* eslint-disable no-console */
import "dotenv/config";
import "tsconfig-paths/register";
import clientPromise from "@/lib/mongodb";

type Vec = {
  userId: string;
  genres: Record<string, number>;
  topArtists: string[];
  lastPlaysAt: string[];
  createdAt?: string;
  updatedAt?: string;
};

const now = new Date().toISOString();
const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3600_000).toISOString();

const SEED: Vec[] = [
  {
    userId: "seed-yoel",
    genres: { chassidic: 12, nigunim: 7, carlebach: 3 },
    topArtists: ["Chabad Nigunim", "MBD", "Avraham Fried"],
    lastPlaysAt: [hoursAgo(1), hoursAgo(5), hoursAgo(12)],
  },
  {
    userId: "seed-ella",
    genres: { modern: 8, israeli_pop: 6, mizrahi: 3 },
    topArtists: ["Ishay Ribo", "Hanan Ben Ari", "Omer Adam"],
    lastPlaysAt: [hoursAgo(2), hoursAgo(9), hoursAgo(20)],
  },
  {
    userId: "seed-malka",
    genres: { haredi: 9, chassidic: 5 },
    topArtists: ["Beri Weber", "Shmueli Ungar"],
    lastPlaysAt: [hoursAgo(3)],
  },
  {
    userId: "seed-dovid",
    genres: { chassidic: 10, nigunim: 6 },
    topArtists: ["Chabad Nigunim", "8th Day"],
    lastPlaysAt: [hoursAgo(4)],
  },
  {
    userId: "seed-mendy",
    genres: { chassidic: 7, dance: 4 },
    topArtists: ["8th Day", "MBD"],
    lastPlaysAt: [hoursAgo(6)],
  },
  {
    userId: "seed-rivka",
    genres: { modern: 9, israeli_pop: 5 },
    topArtists: ["Ishay Ribo", "Noa Kirel"],
    lastPlaysAt: [hoursAgo(7)],
  },
  {
    userId: "seed-sara",
    genres: { chassidic: 8, mizrahi: 2 },
    topArtists: ["Avraham Fried", "Ishay Ribo"],
    lastPlaysAt: [hoursAgo(8)],
  },
  {
    userId: "seed-levi",
    genres: { orthodox: 7, nigunim: 5 },
    topArtists: ["Carlebach", "Chabad Nigunim"],
    lastPlaysAt: [hoursAgo(9)],
  },
].map((v) => ({ ...v, createdAt: now, updatedAt: now }));

async function main() {
  const cli = await clientPromise;
  const db = cli.db(process.env.MONGODB_DB || "maty-music");
  const col = db.collection("music_vectors");

  for (const v of SEED) {
    await col.updateOne(
      { userId: v.userId },
      { $set: v, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    console.log("music vector seeded:", v.userId);
  }

  console.log("DONE.");
  await cli.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
