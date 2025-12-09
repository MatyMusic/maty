import type { Collection, Db, Document } from "mongodb";
import { getClient, DEFAULT_DB } from "@/lib/mongodb";
import type { MusicGroup } from "./types";

const COLLECTION = "music_groups";

let ensured = false;

export async function groupsCol(): Promise<Collection<MusicGroup & Document>> {
  const client = await getClient();
  const db: Db = client.db(DEFAULT_DB);
  const col = db.collection<MusicGroup>(COLLECTION);

  if (!ensured) {
    ensured = true;
    // אינדקסים מומלצים
    await Promise.all([
      col.createIndex({ location: "2dsphere" }),
      col.createIndex({ title: "text", description: "text", tags: 1 }),
      col.createIndex({ purposes: 1, daws: 1, skills: 1, city: 1 }),
      col.createIndex({ ownerId: 1, admins: 1, members: 1 }),
      col.createIndex({ createdAt: -1 }),
    ]).catch(() => {});
  }
  return col;
}
