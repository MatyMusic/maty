import clientPromise from "@/lib/mongodb";

const DB = () => process.env.MONGODB_DB || "maty-music";

export type MediaDoc = {
  userId: string;
  publicId: string;
  secureUrl: string;
  createdAt: Date;
};

async function col() {
  const cli = await clientPromise;
  const db = cli.db(DB());
  const c = db.collection<MediaDoc>("date_media");
  await c.createIndex({ userId: 1, createdAt: -1 });
  await c.createIndex({ publicId: 1 }, { unique: true });
  return c;
}

export async function addMedia(
  userId: string,
  publicId: string,
  secureUrl: string,
) {
  const C = await col();
  const now = new Date();
  await C.insertOne({ userId, publicId, secureUrl, createdAt: now } as any);
}

export async function listMedia(userId: string) {
  const C = await col();
  return C.find({ userId }).sort({ createdAt: -1 }).toArray();
}

export async function removeMedia(userId: string, publicId: string) {
  const C = await col();
  await C.deleteOne({ userId, publicId });
}
