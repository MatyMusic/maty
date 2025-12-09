// src/models/TasteEvent.ts
import { getDb } from "@/lib/mongodb";

export type TasteEventType = "play" | "pause" | "end" | "progress" | "like" | "dislike";

export type TasteEvent = {
  userId: string;        // מזהה משתמש (email/id) או "anon"
  videoId: string;
  event: TasteEventType;
  progressSec?: number;
  durationSec?: number;
  quartile?: 25 | 50 | 75 | 95;
  categories?: string[];
  at: Date;
  ua?: string;
};

export async function tasteCol() {
  const db = await getDb();
  return db.collection<TasteEvent>("taste_events");
}
