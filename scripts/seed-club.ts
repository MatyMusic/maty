// scripts/seed-flub.ts
import "dotenv/config";
import path from "node:path";
import connectDB from "@/lib/db/mongoose";
import { Beat, Post, Profile } from "@/models/club";

async function main() {
  await connectDB();

  // 🔹 ודא שיש פרופיל בסיסי
  const userId = "temp-user";
  await Profile.updateOne(
    { userId },
    {
      $setOnInsert: {
        userId,
        displayName: "MATY Demo",
        bio: "ברוך הבא ל-MATY-FLUB 🎶",
        genres: ["chabad", "mizrahi", "edm"],
      },
    },
    { upsert: true },
  );

  // 🔹 קבצי דמו מקומיים (אם יש) או לשים קישורים משלך
  // אם יש לך /public/test.mp3 בפרויקט — אפשר להשתמש בו:
  const localAudio = "/test.mp3"; // או להחליף ל-URL שלך

  // 🔹 ביטים (דמו)
  await Beat.deleteMany({});
  const beats = await Beat.insertMany([
    {
      ownerId: userId,
      title: "Chabad Groove",
      genre: "chabad",
      bpm: 96,
      aiProvider: "openai",
      audioUrl: localAudio,
    },
    {
      ownerId: userId,
      title: "Mizrahi Night",
      genre: "mizrahi",
      bpm: 104,
      aiProvider: "suno",
      audioUrl: localAudio,
    },
    {
      ownerId: userId,
      title: "EDM Burst",
      genre: "edm",
      bpm: 128,
      aiProvider: "riffusion",
      audioUrl: localAudio,
    },
  ]);

  // 🔹 פוסטים (דמו)
  await Post.deleteMany({});
  const posts = await Post.insertMany([
    {
      authorId: userId,
      text: "שיר דמו — נבדוק את הנגן 🎧",
      genre: "chabad",
      trackUrl: localAudio,
      tags: ["demo", "chabad", "maty"],
    },
    {
      authorId: userId,
      text: "Shorts יגיעו לכאן — אפשר להחליף ל-videoUrl משלך 🎬",
      genre: "mizrahi",
      // videoUrl: "/demo.mp4", // אם יש קובץ
      tags: ["shorts", "mizrahi"],
    },
    {
      authorId: userId,
      text: "בואו נבדוק גם תגובות ומתנות בהמשך 🎁",
      genre: "edm",
      trackUrl: localAudio,
      tags: ["gifts", "edm"],
    },
  ]);

  console.log(
    `✅ Seed done: ${beats.length} beats, ${posts.length} posts, profile for ${userId}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed error:", err?.message || err);
    process.exit(1);
  });
