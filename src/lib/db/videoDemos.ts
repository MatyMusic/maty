// src/lib/db/videoDemos.ts
import { getCollection } from "@/lib/db/mongo";
import { ObjectId } from "mongodb";

export type VideoDemoDoc = {
  _id: ObjectId;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  createdAt: Date;
  likes: number;
  plays: number;
  isPublished: boolean;
};

export type VideoDemoDto = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  createdAt: string;
  likes: number;
  plays: number;
  isPublished: boolean;
};

export function mapVideoDoc(doc: VideoDemoDoc): VideoDemoDto {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    description: doc.description ?? "",
    thumbnailUrl: doc.thumbnailUrl,
    videoUrl: doc.videoUrl,
    createdAt: doc.createdAt.toISOString(),
    likes: doc.likes ?? 0,
    plays: doc.plays ?? 0,
    isPublished: !!doc.isPublished,
  };
}

export async function getVideoCollection() {
  return getCollection<VideoDemoDoc>("about_videos");
}

export async function listPublishedVideos(limit = 24): Promise<VideoDemoDto[]> {
  const col = await getVideoCollection();
  const docs = await col
    .find({ isPublished: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map(mapVideoDoc);
}

export async function insertVideoDemo(input: {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  isPublished?: boolean;
}): Promise<VideoDemoDto> {
  const col = await getVideoCollection();
  const now = new Date();

  const doc: VideoDemoDoc = {
    _id: new ObjectId(),
    title: input.title.trim(),
    description: input.description?.trim() || "",
    thumbnailUrl:
      input.thumbnailUrl?.trim() || "/assets/videos/covers/chuppah-1.jpg",
    videoUrl: input.videoUrl.trim(),
    createdAt: now,
    likes: 0,
    plays: 0,
    isPublished: input.isPublished ?? true,
  };

  await col.insertOne(doc);
  return mapVideoDoc(doc);
}

export async function changeVideoLikes(
  id: string,
  delta: number,
): Promise<VideoDemoDto | null> {
  const col = await getVideoCollection();
  const _id = new ObjectId(id);

  const res = await col.findOneAndUpdate(
    { _id },
    { $inc: { likes: delta } },
    { returnDocument: "after" },
  );

  const doc = res.value;
  if (!doc) return null;

  // לוודא שלא יורד מתחת ל־0
  if (doc.likes < 0) {
    doc.likes = 0;
    await col.updateOne({ _id }, { $set: { likes: 0 } });
  }

  return mapVideoDoc(doc);
}
