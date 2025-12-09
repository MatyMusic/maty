// src/app/api/date/preferences/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { getPreferences, upsertPreferences } from "@/lib/db/date-repo";

/* ---------- utils ---------- */

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

function toStr(v: any) {
  return typeof v === "string" ? v : v != null ? String(v) : "";
}
function normStr(v: any, max = 200) {
  return toStr(v).trim().slice(0, max);
}
function toStrArray(
  v: any,
  { lower = true, max = 12 }: { lower?: boolean; max?: number } = {}
) {
  let arr: string[] = [];
  if (Array.isArray(v)) arr = v.map(toStr);
  else if (typeof v === "string") arr = v.split(",");
  else arr = [];

  arr = arr
    .map((s) => (lower ? s.toLowerCase() : s))
    .map((s) => s.trim())
    .filter(Boolean);

  // ייחוד + חיתוך
  const uniq = Array.from(new Set(arr));
  return uniq.slice(0, max);
}

const dirAliases: Record<string, string> = {
  modern_orthodox: "modern",
  "modern-orthodox": "modern",
  modernorthodox: "modern",
  chassidic: "chasidic",
  chasidut: "chasidic",
};
const allowedDirections = new Set([
  "orthodox",
  "haredi",
  "chasidic",
  "modern",
  "conservative",
  "reform",
  "reconstructionist",
  "secular",
]);

function normDirection(v: any): string | undefined {
  const raw = toStr(v).toLowerCase().trim();
  if (!raw) return undefined;
  const aliased = dirAliases[raw] || raw;
  return allowedDirections.has(aliased) ? aliased : undefined;
}

function clampInt(n: any, min: number, max: number): number | undefined {
  const num = Number.parseInt(String(n), 10);
  if (Number.isNaN(num)) return undefined;
  return Math.min(Math.max(num, min), max);
}

function sanitize(input: any) {
  if (!input || typeof input !== "object") return {};

  // genderWanted: male/female/other/any
  const gRaw =
    input.genderWanted ?? input.gender_wanted ?? input.gender ?? "any";
  const g = toStr(gRaw).toLowerCase().trim();
  const genderWanted =
    g === "male" || g === "female" || g === "other" || g === "any" ? g : "any";

  // גילאים: 18–100, דואגים ש-min <= max
  let ageMin = clampInt(input.ageMin ?? input.min_age, 18, 100) ?? 18;
  let ageMax = clampInt(input.ageMax ?? input.max_age, 18, 100) ?? 100;
  if (ageMin > ageMax) [ageMin, ageMax] = [ageMax, ageMin];

  // מרחק (לא חובה) — תומך גם ב-radius_km
  const distanceKm =
    clampInt(input.distanceKm ?? input.radius_km, 0, 20000) ?? undefined;

  // מדינות/זרמים — כמחרוזת פסיקים או מערך
  const countries = toStrArray(input.countries, { lower: false, max: 10 });
  const rawDirs = toStrArray(input.directions, { lower: true, max: 10 })
    .map((d) => normDirection(d))
    .filter(Boolean) as string[];

  // advanced: רק אם אובייקט "פשוט"
  const adv =
    input.advanced &&
    typeof input.advanced === "object" &&
    !Array.isArray(input.advanced)
      ? input.advanced
      : undefined;

  return {
    genderWanted,
    ageMin,
    ageMax,
    ...(distanceKm !== undefined ? { distanceKm } : {}),
    ...(countries.length ? { countries } : {}),
    ...(rawDirs.length ? { directions: rawDirs } : {}),
    ...(adv ? { advanced: adv } : {}),
  };
}

/* ---------- handlers ---------- */

export async function GET() {
  try {
    const s = await getServerSession(authConfig);
    if (!s?.user)
      return j({ ok: false, error: "unauthorized" }, { status: 401 });

    const userId = (s.user as any).id || s.user.email!;
    const doc = await getPreferences(userId);
    return j({ ok: true, preferences: doc || null });
  } catch (e) {
    console.error("[GET /api/date/preferences] error:", e);
    return j({ ok: false, error: "server_error" }, { status: 500 });
  }
}

async function write(req: NextRequest) {
  try {
    const s = await getServerSession(authConfig);
    if (!s?.user)
      return j({ ok: false, error: "unauthorized" }, { status: 401 });

    // גוף ריק לא מפיל
    const body = await req.json().catch(() => ({}));
    const userId = (s.user as any).id || s.user.email!;
    const patch = sanitize(body);

    // שמירה דרך ה־repo שלך (לפי הממשק שהיה אצלך: upsertPreferences({ ...data, userId }))
    const saved = await upsertPreferences({ ...patch, userId });

    return j({ ok: true, preferences: saved });
  } catch (e) {
    console.error("[WRITE /api/date/preferences] error:", e);
    return j({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return write(req);
}
export async function PUT(req: NextRequest) {
  return write(req);
}

// עוזר ל-preflight וכלים
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET,POST,PUT,OPTIONS,HEAD",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS,HEAD",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "no-store",
    },
  });
}
export async function HEAD() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
