import clientPromise from "@/lib/mongodb";
import type { Db, ObjectId } from "mongodb";

type ChatMessage = {
  _id?: ObjectId;
  fromId: string;
  toId: string;
  text: string;
  createdAt: Date;
};

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
async function getDb(): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName());
}

export async function insertMessage(
  fromId: string,
  toId: string,
  text: string,
) {
  const db = await getDb();
  const C = db.collection<ChatMessage>("chat_messages");
  const msg: ChatMessage = { fromId, toId, text, createdAt: new Date() };
  const { insertedId } = await C.insertOne(msg as any);
  return { ...msg, _id: insertedId };
}

export async function listMessages(
  a: string,
  b: string,
  limit = 100,
  after?: Date,
) {
  const db = await getDb();
  const C = db.collection<ChatMessage>("chat_messages");
  const match: any = {
    $or: [
      { fromId: a, toId: b },
      { fromId: b, toId: a },
    ],
  };
  if (after) match.createdAt = { $gt: after };

  const rows = await C.find(match)
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
  return rows.map((r) => ({ ...r, _id: String(r._id) }));
}
