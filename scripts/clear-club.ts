// scripts/clear-flub.ts
import "dotenv/config";
import connectDB from "@/lib/db/mongoose";
import { Beat, Post, Gift, Payment } from "@/models/club";

async function main() {
  await connectDB();
  const r1 = await Beat.deleteMany({});
  const r2 = await Post.deleteMany({});
  const r3 = await Gift.deleteMany({});
  const r4 = await Payment.deleteMany({});
  console.log(
    `Cleared → beats:${r1.deletedCount} posts:${r2.deletedCount} gifts:${r3.deletedCount} payments:${r4.deletedCount}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
