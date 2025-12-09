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

  locationArea?: string; // "מרכז", "ירושלים", "דרום" וכו'
  radiusKm?: number;

  partnerIntent: PartnerIntent;
  partnerGenderPref?: "male" | "female" | "any";
  partnerMinAge?: number;
  partnerMaxAge?: number;

  note?: string;
  updatedAt: string;
};

/* ========================== Mongo ========================== */

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || "maty-music";
const FIT_PROFILE_COLLECTION =
  process.env.FIT_PROFILE_COLLECTION || "fit_profiles";

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

function sanitizeProfile(input: any, userId: string): FitProfile {
  const now = new Date().toISOString();

  const goals = Array.isArray(input.goals)
    ? (input.goals.filter(Boolean) as Goal[])
    : [];

  const primaryMuscles = Array.isArray(input.primaryMuscles)
    ? input.primaryMuscles
        .map((m: any) => String(m || "").trim())
        .filter(Boolean)
    : [];

  const trainDays = Array.isArray(input.trainDays)
    ? (input.trainDays.filter(Boolean) as TrainDay[])
    : [];

  const styles = Array.isArray(input.styles)
    ? (input.styles.filter(Boolean) as TrainStyle[])
    : [];

  const difficulty =
    input.difficulty === "beginner" ||
    input.difficulty === "intermediate" ||
    input.difficulty === "advanced"
      ? input.difficulty
      : "";

  const trainTime: TrainTime =
    input.trainTime === "morning" ||
    input.trainTime === "noon" ||
    input.trainTime === "evening" ||
    input.trainTime === "flex"
      ? input.trainTime
      : "flex";

  const partnerIntent: PartnerIntent =
    input.partnerIntent === "partner_only" ||
    input.partnerIntent === "group" ||
    input.partnerIntent === "both"
      ? input.partnerIntent
      : "both";

  const partnerGenderPref =
    input.partnerGenderPref === "male" ||
    input.partnerGenderPref === "female" ||
    input.partnerGenderPref === "any"
      ? input.partnerGenderPref
      : "any";

  const partnerMinAge =
    typeof input.partnerMinAge === "number"
      ? Math.max(16, Math.min(90, input.partnerMinAge))
      : undefined;
  const partnerMaxAge =
    typeof input.partnerMaxAge === "number"
      ? Math.max(partnerMinAge || 18, Math.min(99, input.partnerMaxAge))
      : undefined;

  const radiusKm =
    typeof input.radiusKm === "number"
      ? Math.max(1, Math.min(200, input.radiusKm))
      : 10;

  const profile: FitProfile = {
    userId,
    displayName: input.displayName ? String(input.displayName) : undefined,
    avatarUrl: input.avatarUrl ? String(input.avatarUrl) : undefined,

    goals,
    primaryMuscles,
    difficulty,

    trainDays,
    trainTime,
    styles,

    preferIndoor: Boolean(input.preferIndoor),
    preferOutdoor: Boolean(input.preferOutdoor),

    locationArea: input.locationArea ? String(input.locationArea) : undefined,
    radiusKm,

    partnerIntent,
    partnerGenderPref,
    partnerMinAge,
    partnerMaxAge,

    note: input.note ? String(input.note) : undefined,
    updatedAt: now,
  };

  return profile;
}

/* ========================== GET ========================== */

export async function GET() {
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
    const col = db.collection(FIT_PROFILE_COLLECTION);

    const doc = await col.findOne({ userId });
    if (!doc) {
      // פרופיל ברירת מחדל – כדי שתמיד יהיה מה להציג ב־UI
      const empty: FitProfile = {
        userId,
        goals: [],
        primaryMuscles: [],
        difficulty: "",
        trainDays: [],
        trainTime: "flex",
        styles: [],
        preferIndoor: true,
        preferOutdoor: true,
        radiusKm: 10,
        partnerIntent: "both",
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json(
        { ok: true, profile: empty, isNew: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const profile: FitProfile = {
      ...(doc as any),
      userId: String(doc.userId),
    };

    return NextResponse.json(
      { ok: true, profile, isNew: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err: any) {
    console.error("fit/profile GET error", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 },
    );
  }
}

/* ========================== PUT ========================== */

export async function PUT(req: Request) {
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
    const col = db.collection(FIT_PROFILE_COLLECTION);

    const body = await req.json();
    const profile = sanitizeProfile(body, userId);

    await col.updateOne({ userId }, { $set: profile }, { upsert: true });

    return NextResponse.json(
      { ok: true, profile },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err: any) {
    console.error("fit/profile PUT error", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 },
    );
  }
}
