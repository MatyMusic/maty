// src/models/UserTaste.ts
import { getDb } from "@/lib/mongodb";

export type TasteVector = Record<string, number>; // { chabad: 3.2, carlebach: 1.1, ... }

export type UserTaste = {
  userId: string;
  weights: TasteVector;
  updatedAt: Date;
  createdAt: Date;
};

export async function userTasteCol() {
  const db = await getDb();
  return db.collection<UserTaste>("user_taste");
}

export async function bumpTaste(userId: string, categories: string[], inc = 1) {
  if (!categories?.length) return;
  const col = await userTasteCol();
  const $inc: Record<string, number> = {};
  for (const c of categories) $inc[`weights.${c}`] = inc;
  await col.updateOne(
    { userId },
    { $setOnInsert: { createdAt: new Date(), weights: {} }, $inc, $set: { updatedAt: new Date() } },
    { upsert: true }
  );
}
