// src/lib/db-nigunim.ts
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const uri =
  process.env.MONGODB_URI_NIGUNIM ||
  process.env.MONGODB_URI ||
  "mongodb+srv://matymusic:matymusic@matymusic.3gmzc3w.mongodb.net/maty-nigunim?retryWrites=true&w=majority&appName=matymusic";

const dbName = process.env.MONGODB_DB_NIGUNIM || "maty-nigunim";

let client: MongoClient | null = null;

export async function getNigunimDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db(dbName);
}
