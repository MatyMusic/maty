import { prisma } from "../src/lib/prisma";

async function main() {
  const badges = [
    { code: "first-like", name: "לייק ראשון", emoji: "👍" },
    { code: "setlist-maker", name: "בונה סטליסט", emoji: "📝" },
    { code: "concert-hero", name: "גיבור ההופעות", emoji: "🎤" },
    { code: "playlist-pro", name: "אשף פלייליסטים", emoji: "🎧" },
    { code: "early-bird", name: "Early Bird", emoji: "🌅" },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({
      where: { code: b.code },
      update: {},
      create: b,
    });
  }
  console.log("✅ Seeded badges", badges.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
