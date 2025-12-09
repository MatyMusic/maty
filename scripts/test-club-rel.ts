// scripts/test-flub-rel.ts
import "dotenv/config";

// ייבוא RELATIVE כדי להימנע מבעיות alias בסקריפטים
import connectDB from "../src/lib/db/mongoose";
import Beat from "../src/models/club/Beat";
import Post from "../src/models/club/Post";
import Profile from "../src/models/club/Profile";
import Gift from "../src/models/club/Gift";
import Payment from "../src/models/club/Payment";

// מיתוג מרוכז (אופציונלי). אם אין קובץ – נשתמש בברירת מחדל.
let BRAND_SAFE = "MATY-CLUB";
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const branding = require("../src/lib/branding");
  BRAND_SAFE = branding?.BRAND?.club || BRAND_SAFE;
} catch {
  // אין branding.ts – נשתמש ב-MATY-CLUB
}

async function main() {
  console.log("🔎 Checking env…");
  const must = ["MONGODB_URI", "MONGODB_DB"];
  let ok = true;
  for (const k of must) {
    if (!process.env[k]) {
      console.log(`❌ ${k} missing`);
      ok = false;
    } else {
      console.log(`✅ ${k} ok`);
    }
  }
  if (!ok) throw new Error("Missing env vars. Create/update .env.local");

  console.log("⏳ Connecting MongoDB…");
  const m = await connectDB();
  console.log(
    `✅ Connected: db="${m.connection.db.databaseName}" host="${m.connection.host}"`,
  );

  const userId = "temp-user";

  console.log("🔁 Ensuring Profile exists…");
  await Profile.updateOne(
    { userId },
    {
      $setOnInsert: {
        userId,
        displayName: `${BRAND_SAFE} Tester`,
        bio: `${BRAND_SAFE} ✔`,
        genres: ["chabad", "mizrahi"],
      },
    },
    { upsert: true },
  );

  console.log("🧪 Creating test Beat…");
  const beat = await Beat.create({
    ownerId: userId,
    title: `${BRAND_SAFE} Test Beat`,
    genre: "chabad",
    bpm: 96,
    aiProvider: "openai",
    audioUrl: "/test.mp3",
  });
  console.log("✅ Beat OK:", beat._id.toString());

  console.log("🧪 Creating test Post…");
  const post = await Post.create({
    authorId: userId,
    text: `פוסט בדיקה ל־${BRAND_SAFE} 🎶`,
    genre: "mizrahi",
    trackUrl: "/test.mp3",
    tags: ["test", "club"],
  });
  console.log("✅ Post OK:", post._id.toString());

  console.log("📊 Counting collections…");
  const [beats, posts, gifts, payments] = await Promise.all([
    Beat.countDocuments(),
    Post.countDocuments(),
    Gift.countDocuments(),
    Payment.countDocuments(),
  ]);
  console.log(
    `📦 Totals → beats:${beats} posts:${posts} gifts:${gifts} payments:${payments}`,
  );

  console.log(`🎉 TEST PASS — ${BRAND_SAFE} base is healthy`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ TEST FAIL:", err?.stack || err?.message || err);
    process.exit(1);
  });
