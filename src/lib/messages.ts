import { getMainDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export type MessageKind = "system" | "music" | "date" | string;

export type UserMessageDoc = {
  _id?: ObjectId;
  userId: string;
  kind: MessageKind;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  meta?: Record<string, any>;
};

export type UserMessageDto = {
  _id: string;
  userId: string;
  kind: MessageKind;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  meta?: Record<string, any>;
};

function mapDocToDto(doc: UserMessageDoc & { _id: ObjectId }): UserMessageDto {
  return {
    _id: doc._id.toHexString(),
    userId: doc.userId,
    kind: doc.kind,
    title: doc.title,
    body: doc.body,
    read: doc.read,
    createdAt: doc.createdAt.toISOString(),
    meta: doc.meta ?? {},
  };
}

export async function getMessagesCollection() {
  const db = await getMainDb();
  return db.collection<UserMessageDoc>("user-messages");
}

export async function createUserMessage(opts: {
  userId: string;
  kind: MessageKind;
  title: string;
  body: string;
  meta?: Record<string, any>;
}) {
  const col = await getMessagesCollection();

  const doc: UserMessageDoc = {
    userId: opts.userId,
    kind: opts.kind,
    title: opts.title,
    body: opts.body,
    read: false,
    createdAt: new Date(),
    meta: opts.meta ?? {},
  };

  const res = await col.insertOne(doc);
  const inserted = await col.findOne({ _id: res.insertedId });

  if (!inserted) throw new Error("Insert failed");
  return mapDocToDto(inserted as any);
}

export async function countUnreadMessages(userId: string) {
  const col = await getMessagesCollection();
  return col.countDocuments({ userId, read: false });
}

export async function setMessageRead(opts: {
  userId: string;
  messageId: string;
  read: boolean;
}) {
  const col = await getMessagesCollection();
  const _id = new ObjectId(opts.messageId);

  await col.updateOne(
    { _id, userId: opts.userId },
    { $set: { read: opts.read } },
  );

  const doc = await col.findOne({ _id, userId: opts.userId });
  return doc ? mapDocToDto(doc as any) : null;
}

export async function listMessagesForUser(opts: {
  userId: string;
  limit?: number;
  cursor?: string | null;
}) {
  const col = await getMessagesCollection();
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);

  const query: Record<string, any> = { userId: opts.userId };

  if (opts.cursor) {
    const cursorDate = new Date(opts.cursor);
    if (!isNaN(cursorDate.getTime())) {
      query.createdAt = { $lt: cursorDate };
    }
  }

  const docs = await col
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .toArray();

  let nextCursor: string | null = null;
  if (docs.length > limit) {
    nextCursor = docs[limit - 1].createdAt.toISOString();
    docs.splice(limit);
  }

  return {
    items: docs.map((d) => mapDocToDto(d as any)),
    nextCursor,
  };
}
