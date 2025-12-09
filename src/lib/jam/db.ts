// src/lib/jam/db.ts

import type { Collection, Db } from "mongodb";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

import dbPromise from "@/lib/mongoose"; // אותו חיבור שמשרת את כל המודלים
import type { JamGroup, JamMembership, JamSession } from "./types";

export type JamCollections = {
  db: Db;
  groups: Collection<JamGroup & { _id: ObjectId }>;
  memberships: Collection<JamMembership & { _id: ObjectId }>;
  sessions: Collection<JamSession & { _id: ObjectId }>;
};

/**
 * משתמשים בחיבור הקיים של Mongoose במקום לפתוח MongoClient נפרד.
 */
async function getMongoDbFromMongoose(): Promise<Db> {
  // מוודא שמודול mongoose כבר התחבר (dbPromise זה מה שאתה מייבא בכל מקום)
  await dbPromise;

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB לא מחובר (mongoose.connection.db ריק)");
  }
  return db;
}

/**
 * מחזיר את כל הקולקציות של JAM מתוך אותה DB של האתר.
 */
export async function getJamCollections(): Promise<JamCollections> {
  const db = await getMongoDbFromMongoose();

  const groups = db.collection<JamGroup & { _id: ObjectId }>("jam_groups");
  const memberships = db.collection<JamMembership & { _id: ObjectId }>(
    "jam_memberships",
  );
  const sessions = db.collection<JamSession & { _id: ObjectId }>(
    "jam_sessions",
  );

  return { db, groups, memberships, sessions };
}

/**
 * ממיר מסמך שמכיל ObjectId ל-API נוח (string)
 */
export function normalizeId<T extends { _id: any }>(
  doc: T | null,
): (Omit<T, "_id"> & { _id: string }) | null {
  if (!doc) return null;
  const { _id, ...rest } = doc as any;
  return { ...rest, _id: String(_id) };
}

/**
 * slug בסיסי לפי כותרת
 */
export function createSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[\s\W]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
