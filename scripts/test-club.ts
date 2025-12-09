// scripts/seed-flub.ts
import "dotenv/config";

// ✅ ייבוא יחסי (נמנע מאליאסים בסקריפטים)
import connectDB from "../src/lib/db/mongoose";
import Beat from "../src/models/club/Beat";
import Post from "../src/models/club/Post";
import Profile from "../src/models/club/Profile";

// מיתוג בטוח (אם יש src/lib/branding.ts נמשוך ממנו)
let CLUB = "MATY-CLUB";
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const branding = require("../src/lib/branding");
  CLUB = branding?.BRAND?.club || CLUB;
} catch {}

async function main() {
  await connectDB();

  // 🔹 ודא שיש פרופיל בסיסי
  const userId = "temp-user";
  await Profile.updateOne(
    { userId },
    {
      $setOnInsert: {
        userId,
        displayName: `${CLUB} Demo`,
        bio: `ברוך הבא ל-${CLUB} 🎶`,
        genres: ["chabad", "mizrahi", "edm"],
      },
    },
    { upsert: true },
  );

  // 🔹 קובץ דמו מקומי (שים /public/test.mp3 או החלף ל-URL שלך)
  const localAudio = "/test.mp3";

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
      text: `שיר דמו — ${CLUB} נגן 🎧`,
      genre: "chabad",
      trackUrl: localAudio,
      tags: ["demo", "chabad", "club"],
    },
    {
      authorId: userId,
      text: "Shorts יגיעו לכאן — אפשר להחליף ל-videoUrl משלך 🎬",
      genre: "mizrahi",
      // videoUrl: "/demo.mp4",
      tags: ["shorts", "mizrahi", "club"],
    },
    {
      authorId: userId,
      text: "בואו נבדוק גם תגובות ומתנות בהמשך 🎁",
      genre: "edm",
      trackUrl: localAudio,
      tags: ["gifts", "edm", "club"],
    },
  ]);

  console.log(
    `✅ Seed done: ${beats.length} beats, ${posts.length} posts, profile for ${userId}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed error:", err?.stack || err?.message || err);
    process.exit(1);
  });
