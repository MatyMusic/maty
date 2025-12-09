/* eslint-disable @typescript-eslint/no-explicit-any */
import { authOptions } from "@/lib/auth";
import { Db, MongoClient } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ========================== Types ========================== */

type TrainDay = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
type TrainTime = "morning" | "noon" | "evening" | "flex";
type TrainStyle =
  | "gym"
  | "home"
  | "outdoor"
  | "crossfit"
  | "run"
  | "combat"
  | "yoga";
type Goal = "fat_loss" | "muscle" | "performance" | "health" | "rehab";
type PartnerIntent = "partner_only" | "group" | "both";

type FitProfile = {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  goals: Goal[];
  primaryMuscles: string[];
  difficulty: "" | "beginner" | "intermediate" | "advanced";
  trainDays: TrainDay[];
  trainTime: TrainTime;
  styles: TrainStyle[];
  preferIndoor: boolean;
  preferOutdoor: boolean;
  locationArea?: string;
  radiusKm?: number;
  partnerIntent: PartnerIntent;
  partnerGenderPref?: "male" | "female" | "any";
  partnerMinAge?: number;
  partnerMaxAge?: number;
  note?: string;
  updatedAt: string;
};

type DateProfile = {
  _id: any;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  age?: number;
  gender?: "male" | "female" | "other";

  // מידע "כושר" שמגיע מ-MATY-DATE (אתה יכול לעדכן את המודל שלך בהתאם)
  fitGoals?: Goal[];
  fitStyles?: TrainStyle[];
  fitDays?: TrainDay[];
  fitMuscles?: string[];
  fitLevel?: "" | "beginner" | "intermediate" | "advanced";

  locationArea?: string;
  note?: string;
};

type MatchScore = {
  profile: DateProfile;
  score: number;
  reasons: string[];
  common: {
    days: TrainDay[];
    styles: TrainStyle[];
    goals: Goal[];
    muscles: string[];
  };
};

/* ========================== Mongo ========================== */

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || "maty-music";
const FIT_PROFILE_COLLECTION =
  process.env.FIT_PROFILE_COLLECTION || "fit_profiles";
const DATE_PROFILE_COLLECTION =
  process.env.DATE_PROFILE_COLLECTION || "date_profiles";

let _db: Db | null = null;

async function getDb() {
  if (_db) return _db;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  _db = client.db(MONGODB_DB);
  return _db;
}

/* ========================== Helpers ========================== */

function requireSessionUserId(session: any) {
  const userId =
    (session?.user as any)?.id ||
    (session?.user as any)?._id ||
    (session?.user as any)?.userId;
  if (!userId) throw new Error("no-user-id");
  return String(userId);
}

function intersect<T extends string>(
  a: T[] | undefined,
  b: T[] | undefined,
): T[] {
  if (!a?.length || !b?.length) return [];
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

/**
 * מחשב ציון התאמה + סיבות
 */
function computeMatchScore(me: FitProfile, other: DateProfile): MatchScore {
  let score = 0;
  const reasons: string[] = [];

  const commonDays = intersect(me.trainDays, other.fitDays || []);
  if (commonDays.length) {
    score += commonDays.length * 8;
    reasons.push("אותם ימי אימון");
  }

  const commonStyles = intersect(me.styles, other.fitStyles || []);
  if (commonStyles.length) {
    score += commonStyles.length * 12;
    reasons.push("אותו סגנון אימון");
  }

  const commonGoals = intersect(me.goals, other.fitGoals || []);
  if (commonGoals.length) {
    score += commonGoals.length * 10;
    reasons.push("אותם יעדי כושר");
  }

  const commonMuscles = intersect(
    me.primaryMuscles || [],
    other.fitMuscles || [],
  );
  if (commonMuscles.length) {
    score += commonMuscles.length * 6;
    reasons.push("עבודה על אותם שרירים");
  }

  if (
    me.locationArea &&
    other.locationArea &&
    me.locationArea === other.locationArea
  ) {
    score += 15;
    reasons.push("אותו אזור בארץ");
  }

  // רמת קושי / ניסיון
  if (me.difficulty && other.fitLevel) {
    if (me.difficulty === other.fitLevel) {
      score += 10;
      reasons.push("אותה רמת קושי");
    } else {
      score += 3; // עדיין טוב שיהיה "שונה קצת" – אפשרות להוביל/ללמוד
      reasons.push("רמת קושי משלימה");
    }
  }

  // גיל וג’נדר – רק כפילטר "קשה"
  if (typeof other.age === "number") {
    if (me.partnerMinAge && other.age < me.partnerMinAge) {
      score -= 50;
      reasons.push("צעיר/ה מהטווח שלך");
    }
    if (me.partnerMaxAge && other.age > me.partnerMaxAge) {
      score -= 50;
      reasons.push("מבוגר/ת מהטווח שלך");
    }
  }

  if (me.partnerGenderPref && me.partnerGenderPref !== "any" && other.gender) {
    if (me.partnerGenderPref !== other.gender) {
      score -= 100;
      reasons.push("מגדר לא תואם העדפה");
    }
  }

  // בונוס קל על מידע מלא / תמונה
  if (other.avatarUrl) score += 3;
  if (other.fitStyles?.length) score += 2;
  if (other.fitGoals?.length) score += 2;

  return {
    profile: other,
    score,
    reasons,
    common: {
      days: commonDays,
      styles: commonStyles,
      goals: commonGoals,
      muscles: commonMuscles,
    },
  };
}

/* ========================== GET ========================== */

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    const userId = requireSessionUserId(session);
    const db = await getDb();
    const fitCol = db.collection(FIT_PROFILE_COLLECTION);
    const dateCol = db.collection(DATE_PROFILE_COLLECTION);

    // 1) פרופיל כושר שלי
    const meDoc = await fitCol.findOne({ userId });
    if (!meDoc) {
      return NextResponse.json(
        {
          ok: false,
          error: "no-fit-profile",
          message: "לא קיים פרופיל MATY-FIT. שמור קודם פרופיל כושר.",
        },
        { status: 400 },
      );
    }
    const me = meDoc as unknown as FitProfile;

    // 2) שליפת פרופילי DATE רלוונטיים (פילטר גס לפי אזור / גיל / מגדר)
    const url = new URL(req.url);
    const limitRaw = Number(url.searchParams.get("limit") || "30");
    const limit = Math.max(5, Math.min(60, limitRaw));

    const dateFilter: any = {
      userId: { $ne: userId }, // לא אני
    };

    if (me.locationArea) {
      dateFilter.locationArea = me.locationArea;
    }

    if (me.partnerGenderPref && me.partnerGenderPref !== "any") {
      dateFilter.gender = me.partnerGenderPref;
    }

    if (me.partnerMinAge || me.partnerMaxAge) {
      dateFilter.age = {};
      if (me.partnerMinAge) dateFilter.age.$gte = me.partnerMinAge;
      if (me.partnerMaxAge) dateFilter.age.$lte = me.partnerMaxAge;
    }

    const rawCandidates = (await dateCol
      .find(dateFilter)
      .limit(200)
      .toArray()) as unknown as DateProfile[];

    // 3) מחשבים ציון התאמה
    const scored: MatchScore[] = rawCandidates.map((p) =>
      computeMatchScore(me, p),
    );

    // 4) ממיינים לפי ציון, מסננים שלילים, חותכים לפי limit
    const positive = scored
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const items = positive.map((m) => ({
      userId: m.profile.userId,
      displayName: m.profile.displayName,
      avatarUrl: m.profile.avatarUrl,
      age: m.profile.age,
      gender: m.profile.gender,
      locationArea: m.profile.locationArea,
      score: m.score,
      reasons: m.reasons,
      common: m.common,
    }));

    return NextResponse.json(
      {
        ok: true,
        total: items.length,
        items,
        note: "fit-matches: שידוכי שותפי אימון/DATE לפי פרופיל MATY-FIT",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err: any) {
    console.error("date/fit-matches GET error", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 },
    );
  }
}
