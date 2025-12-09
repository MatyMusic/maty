// scripts/ensure-nigunim-indexes.ts (אפשר להריץ ידנית ב-node או בקריאה חד-פעמית מהשרת)
import { getCollection } from "@/lib/db"; // זה ה-getCollection שלך
export async function ensureNigunimIndexes() {
  const col = await getCollection("nigunim");
  await col.createIndex({ title: "text", altTitles: "text", artists: "text" });
  await col.createIndex({ tags: 1 });
  await col.createIndex({ sourceType: 1 });
  await col.createIndex({ cat: 1 });
}
