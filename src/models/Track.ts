// src/models/Track.ts
import { getDb } from "@/lib/mongodb";

export type TrackSource = "youtube";
export type TrackCategory =
  | "chabad"
  | "carlebach"
  | "breslov"
  | "russian"
  | "nichoach"
  | "other";

export type TrackDoc = {
  _id: string;              // "yt:{videoId}"
  source: TrackSource;      // "youtube"
  videoId: string;          // YouTube id
  title: string;
  channelId?: string;
  channelTitle?: string;
  description?: string;
  thumbnails?: { default?: string; medium?: string; high?: string };
  durationSec?: number;
  publishedAt?: string;     // ISO
  tags?: string[];
  categories: TrackCategory[];
  lang?: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function tracksCol() {
  const db = await getDb();
  return db.collection<TrackDoc>("tracks");
}
