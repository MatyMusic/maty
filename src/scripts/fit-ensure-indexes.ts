// src/scripts/fit-ensure-indexes.ts
/* eslint-disable no-console */
import { connectMongo } from "@/lib/fit/db";
import FitExercise from "@/lib/fit/models/FitExercise";

(async () => {
  const useNigunim = process.argv.includes("--db=nigunim");
  await connectMongo({ useNigunim });
  console.log("✅ Connected Mongo");

  await FitExercise.syncIndexes();
  console.log("✅ fit_exercises indexes ensured");

  process.exit(0);
})().catch((err) => {
  console.error("❌ ensure-indexes failed:", err);
  process.exit(1);
});
