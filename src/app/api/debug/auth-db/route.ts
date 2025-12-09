import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function GET() {
  const db = await getDb(process.env.MONGODB_DB || "matymusic");
  const usersCount = await db
    .collection("users")
    .countDocuments()
    .catch(() => -1);
  const cols = (await db.listCollections().toArray()).map((c) => c.name);
  return NextResponse.json({ db: db.databaseName, cols, usersCount });
}
