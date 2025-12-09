import "dotenv/config";
import mongoose from "mongoose";
import User from "@/lib/db/models/User"; // נתיב לפי הפרויקט שלך
import connectDB from "@/lib/db/mongoose";

async function main() {
  await connectDB();

  // אוסף מופעים לפי אימייל
  const pipeline = [
    { $group: { _id: "$email", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
  ];

  const dups = await (User as any).aggregate(pipeline);
  if (!dups.length) {
    console.log("✅ אין כפילויות אימייל. אפשר לרוץ עם unique index בשקט.");
  } else {
    console.log("⚠️ נמצאו כפילויות:");
    for (const d of dups) {
      console.log(`- ${d._id} (x${d.count}): ${d.ids.join(", ")}`);
    }
    console.log("\nטפל בכפילויות (איחוד/מחיקה) לפני יצירת האינדקס הייחודי.");
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
