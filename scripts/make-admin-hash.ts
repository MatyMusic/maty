// scripts/make-admin-hash.ts
import bcrypt from "bcryptjs";

async function main() {
  const plain = process.argv[2];
  if (!plain) {
    console.error("msyeg5770");
    process.exit(1);
  }

  const hash = await bcrypt.hash(plain, 12);
  console.log("✅ Hash מוכן:");
  console.log(hash);
}

main();
