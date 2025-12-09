// scripts/seed-admin.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongo-client"; // או חיבור mongoose שלך

async function main() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "matymusic");
  const users = db.collection("users");

  const email = "matymusic770@gmail.com".toLowerCase(); // האימייל שלך
  const passwordHash = await bcrypt.hash("matyG204071443$", 10); // שנה לסיסמה חזקה

  await users.updateOne(
    { email },
    {
      $set: {
        email,
        name: "Maty Admin",
        passwordHash,
        role: "admin", // אינפורמטיבי במסד (נוח ל־UI/דוחות)
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  // ודא אינדקס ייחודי על email
  await users.createIndex({ email: 1 }, { unique: true });

  console.log("✅ Admin ensured in DB:", email);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error seeding admin:", err);
  process.exit(1);
});
