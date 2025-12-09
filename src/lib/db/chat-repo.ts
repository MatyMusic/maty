// src/lib/db/chat-repo.ts
import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type ChatMessage = {
  _id?: ObjectId;
  chatId: string; // chatKey(userA,userB)
  from: string; // userId שולח
  to: string; // userId מקבל
  text: string;
  at: string; // ISO
};

function chatKey(a: string, b: string): string {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}__${y}`;
}

async function ensureIndexes(c: Collection<ChatMessage>) {
  const wanted = [
    { key: { chatId: 1, _id: 1 }, name: "chatId_id" },
    { key: { chatId: 1, at: 1 }, name: "chatId_at" },
    { key: { from: 1, at: -1 }, name: "from_at_desc" },
  ];
  const existing = await c
    .listIndexes()
    .toArray()
    .catch(() => []);
  const have = new Set(existing.map((i: any) => String(i.name)));
  for (const idx of wanted) {
    if (!have.has(idx.name)) {
      try {
        await c.createIndex(idx.key as any, { name: idx.name });
      } catch {}
    }
  }
}

async function messagesCol(): Promise<Collection<ChatMessage>> {
  const db = await getDb();
  const c = db.collection<ChatMessage>("date_messages");
  await ensureIndexes(c);
  return c;
}

export function chatIdFor(a: string, b: string): string {
  return chatKey(a, b);
}

export async function listMessages(
  meId: string,
  peerId: string,
  limit = 50,
  beforeId?: string | null
) {
  const c = await messagesCol();
  const chatId = chatKey(meId, peerId);
  const q: any = { chatId };
  if (beforeId && ObjectId.isValid(beforeId))
    q._id = { $lt: new ObjectId(beforeId) };

  const docs = await c
    .find(q)
    .sort({ _id: 1 }) // עולה — לתצוגה נוחה
    .limit(Math.min(Math.max(limit, 1), 200))
    .toArray();

  return docs;
}

export async function addMessage(from: string, to: string, text: string) {
  const c = await messagesCol();
  const doc: ChatMessage = {
    chatId: chatKey(from, to),
    from,
    to,
    text: String(text || "").slice(0, 2000),
    at: new Date().toISOString(),
  };
  const r = await c.insertOne(doc);
  doc._id = r.insertedId;
  return doc;
}
