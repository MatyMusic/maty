// src/app/api/dev/seed-date/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongo";

/* ===== Types (לוקאליים לסקריפט) ===== */
type Gender = "male" | "female" | "other";
type Level = "strict" | "partial" | "none";
type Direction =
  | "orthodox"
  | "haredi"
  | "chasidic"
  | "modern"
  | "conservative"
  | "reform"
  | "reconstructionist"
  | "secular";
type Goal = "serious" | "marriage" | "friendship";
type Tier = "free" | "plus" | "pro" | "vip";

/* ===== Utils ===== */
const rand = <T>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const chance = (p: number) => Math.random() < p;
const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

function birthDateBetween(minAge: number, maxAge: number) {
  // גיל 21–45 כברירת מחדל
  const now = new Date();
  const y =
    now.getFullYear() -
    (minAge + Math.floor(Math.random() * (maxAge - minAge + 1)));
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return `${y}-${pad(m)}-${pad(d)}`;
}

function nameFor(g: Gender) {
  const male = [
    "מתי",
    "דניאל",
    "יואב",
    "איתי",
    "עומר",
    "אלון",
    "יהודה",
    "אליה",
    "נבו",
    "שחר",
  ];
  const female = [
    "נוי",
    "נועה",
    "רות",
    "שיר",
    "שירן",
    "דנה",
    "מאיה",
    "תמר",
    "יעלה",
    "הילה",
  ];
  const other = ["סול", "רוני", "תום", "ים"];
  return g === "male"
    ? rand(male)
    : g === "female"
    ? rand(female)
    : rand(other);
}

/* ===== Mock Data ===== */
const COUNTRIES = ["ישראל", "ארה״ב", "אנגליה", "צרפת", "קנדה"] as const;
const CITIES_IL = [
  "ירושלים",
  "תל אביב",
  "בית שמש",
  "בני ברק",
  "חיפה",
  "מודיעין",
  "ראשון לציון",
] as const;
const CITIES_US = ["NYC", "LA", "Miami", "Brooklyn"] as const;

const DIRS: Direction[] = [
  "orthodox",
  "haredi",
  "chasidic",
  "modern",
  "conservative",
  "reform",
  "reconstructionist",
  "secular",
];

const LVLS: Level[] = ["strict", "partial", "none"];
const GOALS: Goal[] = ["serious", "marriage", "friendship"];
const LANGS = [
  "עברית",
  "אנגלית",
  "רוסית",
  "צרפתית",
  "ספרדית",
  "אמהרית",
  "ערבית",
] as const;

// אווטארים מקומיים (ללא תלות בחוץ)
const FALLBACKS = ["/icon-192.png", "/icon-512.png"] as const;

/* ===== Profile Factory ===== */
function makeProfile(i: number) {
  const gender: Gender = rand([
    "male",
    "female",
    chance(0.08) ? "other" : "male",
  ]);
  const country = chance(0.75) ? "ישראל" : rand(COUNTRIES);
  const city =
    country === "ישראל" ? rand(CITIES_IL) : rand([...CITIES_US, ""] as const);

  const displayName = nameFor(gender);
  const direction = rand(DIRS);
  const kashrut = rand(LVLS);
  const shabbat = rand(LVLS);
  const tzniut: Level | null = chance(0.6) ? rand(LVLS) : null;
  const goal = rand(GOALS);
  const birthDate = birthDateBetween(21, 45);

  const tier: Tier = rand(["free", "plus", "pro", "vip"]);
  const active = tier === "free" ? chance(0.2) : chance(0.85);

  const now = new Date();
  const nowISO = now.toISOString();

  // תמונות — חלק עם תמונה, חלק רק אווטאר/ריק
  const avatarUrl = chance(0.5) ? rand(FALLBACKS) : null;
  const photos = chance(0.6)
    ? [avatarUrl || rand(FALLBACKS)]
    : chance(0.2)
    ? [rand(FALLBACKS), rand(FALLBACKS)]
    : [];

  return {
    _seedTag: "dev-seed",
    userId: `seed:${i}:${Math.random().toString(36).slice(2, 8)}`,

    // בסיס
    displayName,
    birthDate, // YYYY-MM-DD
    gender,
    country,
    city,
    languages: Array.from(
      new Set(
        [rand(LANGS), chance(0.5) ? rand(LANGS) : undefined].filter(Boolean)
      )
    ),

    // Jewish identity
    judaism_direction: direction,
    kashrut_level: kashrut,
    shabbat_level: shabbat,
    tzniut_level: tzniut,

    // Goals / About
    goals: goal,
    about_me:
      "קצת עליי: אוהב/ת קהילה, לימוד, משפחה וחברים. מחפש/ת חיבור של ערכים וכימיה. אוהב/ת מוזיקה, טיולים וקפה טוב.",

    // מדיה
    avatarUrl,
    photos,

    // סטטוס
    verified: chance(0.35),
    online: active ? chance(0.6) : chance(0.2),

    // מנוי (תואם לסכמה DateProfileDoc)
    subscription: {
      status: active ? "active" : "inactive",
      tier,
      expiresAt: active
        ? new Date(
            now.getTime() + (15 + Math.random() * 60) * 86400000
          ).toISOString()
        : null,
    },

    // זמני מערכת
    updatedAt: nowISO,
    createdAt: nowISO,
  };
}

/* ===== GET /api/dev/seed-date =====
   שימוש:
   - DEV:           /api/dev/seed-date?n=36&reset=1
   - PROD (מאובטח): שלח כותרת X-Seed-Key תואמת ל-SEED_KEY
===================================================== */
export async function GET(req: NextRequest) {
  try {
    // הגנה ל-Prod: חייבים מפתח
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev && req.headers.get("x-seed-key") !== process.env.SEED_KEY) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const n = Math.max(
      1,
      Math.min(100, Number(url.searchParams.get("n") || 24))
    );
    const reset = url.searchParams.get("reset") === "1";

    const db = await getDb(process.env.MONGODB_DB || "maty-music");
    const col = db.collection("date_profiles");

    // אינדקסים שימושיים (תואם ל-date-repo)
    await Promise.allSettled([
      col.createIndex({ userId: 1 }, { unique: true, name: "userId_unique" }),
      col.createIndex(
        { updatedAt: -1, _id: -1 },
        { name: "updated_desc_id_desc" }
      ),
      col.createIndex(
        {
          country: 1,
          city: 1,
          judaism_direction: 1,
          gender: 1,
          goals: 1,
          birthDate: 1,
          updatedAt: -1,
          _id: -1,
        },
        { name: "match_filters_v1" }
      ),
      col.createIndex({ "subscription.status": 1 }, { name: "sub_status" }),
      col.createIndex({ "subscription.tier": 1 }, { name: "sub_tier" }),
      col.createIndex({ online: 1 }, { name: "online" }),
      col.createIndex({ avatarUrl: 1 }, { name: "avatarUrl" }),
      col.createIndex({ "photos.0": 1 }, { name: "photos0" }),
    ]);

    if (reset) {
      await col.deleteMany({ _seedTag: "dev-seed" });
    }

    const docs = Array.from({ length: n }).map((_, i) => makeProfile(i + 1));
    const res = await col.insertMany(docs, { ordered: false });

    return NextResponse.json({
      ok: true,
      inserted: res.insertedCount,
      hint: "פתח/י /date/matches והפעל סינון 'פעילים בלבד' כדי לראות מנויי active.",
    });
  } catch (e: any) {
    console.error("[seed-date] error", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 500 }
    );
  }
}
