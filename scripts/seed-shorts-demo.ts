import "dotenv/config";
import connectDB from "@/lib/db/mongoose";
import Post from "@/models/club/Post";

async function main() {
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
    throw new Error("Missing MONGODB_URI / MONGODB_DB");
  }
  await connectDB();

  const userId = "temp-user";
  const now = new Date();
  const demos = [
    {
      text: "Short דמו #1 — בואו נזוז 🎵",
      genre: "club",
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      authorId: userId,
      createdAt: now,
    },
    {
      text: "Short דמו #2 — אווירת ניגון",
      genre: "chabad",
      videoUrl:
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      authorId: userId,
      createdAt: new Date(now.getTime() - 1000 * 60 * 3),
    },
    {
      text: "Short דמו #3 — קצת אנרגיות",
      genre: "mizrahi",
      videoUrl:
        "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/beer.mp4",
      authorId: userId,
      createdAt: new Date(now.getTime() - 1000 * 60 * 8),
    },
  ];

  const inserted = await Post.insertMany(demos);
  console.log(`✅ Inserted ${inserted.length} shorts`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
