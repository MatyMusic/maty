// src/lib/db/clubComments.ts
import { ObjectId, WithId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type ClubComment = {
  _id?: ObjectId;
  postId: ObjectId;
  authorId: string;
  authorName?: string | null;
  authorAvatar?: string | null;
  text: string;
  parentId?: ObjectId | null;
  likes?: number;
  repliesCount?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

const COLLECTION = "club_comments";

export async function ensureIndexes() {
  const db = await getDb();
  const col = db.collection(COLLECTION);
  await col.createIndex({ postId: 1, createdAt: 1 });
  await col.createIndex({ parentId: 1, createdAt: 1 });
  await col.createIndex({ authorId: 1, createdAt: -1 });
}

export async function listComments(
  postId: string,
  opts?: { parentId?: string | null; after?: string | null; limit?: number },
) {
  const db = await getDb();
  const col = db.collection<ClubComment>(COLLECTION);

  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 50);
  const query: any = {
    postId: new ObjectId(postId),
    deletedAt: { $exists: false },
  };
  if (opts?.parentId === null) {
    query.parentId = { $in: [null, undefined] };
  } else if (opts?.parentId) {
    query.parentId = new ObjectId(opts.parentId);
  }
  if (opts?.after) {
    try {
      query._id = { $gt: new ObjectId(opts.after) };
    } catch {}
  }

  const items = await col
    .find(query)
    .sort({ createdAt: 1 })
    .limit(limit + 1)
    .toArray();
  const hasMore = items.length > limit;
  const slice = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? String(slice[slice.length - 1]._id) : null;

  return { items: slice, nextCursor };
}

export async function countComments(postId: string) {
  const db = await getDb();
  const col = db.collection<ClubComment>(COLLECTION);
  return await col.countDocuments({
    postId: new ObjectId(postId),
    deletedAt: { $exists: false },
  });
}

export async function createComment(input: {
  postId: string;
  authorId: string;
  authorName?: string | null;
  authorAvatar?: string | null;
  text: string;
  parentId?: string | null;
}) {
  const db = await getDb();
  const col = db.collection<ClubComment>(COLLECTION);

  const now = new Date();
  const doc: ClubComment = {
    postId: new ObjectId(input.postId),
    authorId: input.authorId,
    authorName: input.authorName ?? null,
    authorAvatar: input.authorAvatar ?? null,
    text: (input.text || "").trim(),
    parentId: input.parentId ? new ObjectId(input.parentId) : null,
    likes: 0,
    repliesCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  if (!doc.text) throw new Error("empty_text");

  const res = await col.insertOne(doc);
  return { ...doc, _id: res.insertedId };
}

export async function deleteComment(
  commentId: string,
  byUserId: string,
  isAdmin: boolean,
) {
  const db = await getDb();
  const col = db.collection<ClubComment>(COLLECTION);

  const existing = await col.findOne({ _id: new ObjectId(commentId) });
  if (!existing) throw new Error("not_found");

  if (!isAdmin && existing.authorId !== byUserId) {
    throw new Error("forbidden");
  }

  await col.updateOne(
    { _id: existing._id },
    { $set: { deletedAt: new Date(), text: "" } },
  );
  return { ok: true };
}

export async function likeComment(commentId: string, byUserId: string) {
  const db = await getDb();
  const col = db.collection<ClubComment>(COLLECTION);
  const _id = new ObjectId(commentId);
  await col.updateOne({ _id }, { $inc: { likes: 1 } });
  const updated = await col.findOne({ _id });
  return updated;
}
