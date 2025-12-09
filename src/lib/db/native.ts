import type { MongoClient, Db } from "mongodb";
import mongoose from "mongoose";
import { connectDB } from "./connect";

const pickDbName = () =>
  process.env.MONGODB_DB ||
  (() => {
    try {
      return (
        new URL(process.env.MONGODB_URI || "").pathname.replace(/^\//, "") ||
        "maty-music"
      );
    } catch {
      return "maty-music";
    }
  })();

export async function getNativeClient(): Promise<MongoClient> {
  await connectDB();
  const getClient = (mongoose.connection as any)?.getClient;
  if (!getClient) throw new Error("Mongoose connection not ready");
  return getClient() as MongoClient;
}

export async function getDb(name?: string): Promise<Db> {
  const client = await getNativeClient();
  return client.db(name || pickDbName());
}
