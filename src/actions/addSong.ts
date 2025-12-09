// src/actions/addSong.ts
"use server";

import { getDb } from "@/lib/mongo";

export async function addSong(data: { title: string; artist: string }) {
  const db = await getDb();
  await db.collection("songs").insertOne({
    ...data,
    createdAt: new Date(),
  });
  return { ok: true };
}
