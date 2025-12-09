import { getCollection } from "@/lib/mongodb";
import { COLL } from "./collections";

export async function ensureDateIndexes() {
  const profiles = await getCollection(COLL.profiles);
  await profiles.createIndex({ userId: 1 }, { unique: true });
  await profiles.createIndex({ "genres.key": 1 });
  await profiles.createIndex({ country: 1, city: 1 });
  await profiles.createIndex({ updatedAt: -1 });

  const answers = await getCollection(COLL.answers);
  await answers.createIndex({ userId: 1, questionId: 1 }, { unique: true });

  return true;
}
