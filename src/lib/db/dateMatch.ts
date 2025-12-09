// src/lib/db/dateMatch.ts
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getOnlinePeers } from "./analytics";

export type DateProfile = {
  userId: string; // מזהה משתמש (מה-Auth)
  displayName?: string | null;
  photo?: string | null;

  // תחומי עניין כלליים (לא מידע רגיש!)
  tags?: string[]; // למשל: ["chabad","mizrahi","soft","fun","wedding","event"]
  locationArea?: string | null; // "מרכז", "ירושלים", "צפון", "שרון"...

  // Opt-in ל-MATY-DATE
  optedIn: boolean;

  // העדפות פשוטות
  wants?: string[]; // אילו תגיות הייתי רוצה אצל הצד השני
  tz?: string | null; // אזור זמן (מחרוזת)
  updatedAt: Date;
};

export async function ensureDateIndexes() {
  const db = await getDb();
  const prof = db.collection("date_profiles");
  const recs = db.collection("date_recommendations");

  await prof.createIndex({ userId: 1 }, { unique: true });
  await prof.createIndex({ optedIn: 1, updatedAt: -1 });
  await prof.createIndex({ tags: 1 });
  await recs.createIndex({ userId: 1, createdAt: -1 });
}

export async function upsertDateProfile(
  userId: string,
  patch: Partial<DateProfile>,
) {
  const db = await getDb();
  const prof = db.collection<DateProfile>("date_profiles");
  const now = new Date();

  const doc: Partial<DateProfile> = {
    ...patch,
    userId,
    updatedAt: now,
  };
  if (typeof doc.optedIn !== "boolean") {
    // ברירת מחדל: לא opt-in (עד שישלחו POST עם optedIn:true)
    doc.optedIn = false;
  }

  await prof.updateOne({ userId }, { $set: doc }, { upsert: true });
  return prof.findOne({ userId });
}

export async function getProfile(userId: string) {
  const db = await getDb();
  const prof = db.collection<DateProfile>("date_profiles");
  return prof.findOne({ userId });
}

// ציון התאמה פשוט: חיתוך תגיות + בונוס אזור-זמן + בונוס "און-ליין עכשיו"
function scorePair(a: DateProfile, b: DateProfile, onlineUids: Set<string>) {
  const aTags = new Set(a.tags || []);
  const bTags = new Set(b.tags || []);
  const inter = [...aTags].filter((t) => bTags.has(t));
  let score = inter.length * 10;

  if (a.tz && b.tz && a.tz === b.tz) score += 5;
  if (a.locationArea && b.locationArea && a.locationArea === b.locationArea)
    score += 6;

  // אם שני הצדדים אונליין כרגע — בונוס לפגישה חיה
  const aOnline = onlineUids.has(a.userId);
  const bOnline = onlineUids.has(b.userId);
  if (aOnline) score += 3;
  if (bOnline) score += 3;

  // אם יש "wants" — תן תוספת קטנה אם זה מסתדר
  const wants = new Set((a.wants || []).concat(b.wants || []));
  const okWants = [...wants].filter((t) => aTags.has(t) || bTags.has(t)).length;
  score += okWants * 2;

  return {
    score,
    reasons: {
      inter,
      sameTz: a.tz && a.tz === b.tz,
      sameArea: a.locationArea && a.locationArea === b.locationArea,
      online: aOnline && bOnline,
    },
  };
}

export async function getRecommendationsFor(userId: string, limit = 6) {
  const db = await getDb();
  const profCol = db.collection<DateProfile>("date_profiles");

  const me = await profCol.findOne({ userId });
  if (!me || !me.optedIn) return { items: [], reason: "not_opted_in" };

  const all = await profCol
    .find({ optedIn: true, userId: { $ne: userId } })
    .limit(200)
    .toArray();

  // מי אונליין (uid יכול להיות userId או anonId — כאן נשתמש ב-userId בלבד)
  const onlinePeers = await getOnlinePeers({});
  const onlineUids = new Set(onlinePeers.map((p) => String(p.userId || "")));

  const scored = all
    .map((x) => ({ other: x, ...scorePair(me, x, onlineUids) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((it) => ({
      userId: it.other.userId,
      displayName: it.other.displayName || "משתמש",
      photo: it.other.photo || null,
      score: it.score,
      reasons: it.reasons,
      tags: it.other.tags || [],
      locationArea: it.other.locationArea || null,
      onlineNow: onlineUids.has(it.other.userId),
    }));

  return { items: scored };
}
