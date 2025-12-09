// // src/app/api/date/profile/route.ts
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import authConfig from "@/auth-config";
// import {
//   getProfile,
//   upsertProfile,
//   type DateProfileDoc,
// } from "@/lib/db/date-repo";

// /* ---------- helpers ---------- */

// function j(data: unknown, init?: ResponseInit) {
//   return NextResponse.json(data, {
//     ...init,
//     headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
//   });
// }

// const dirAliases: Record<string, DateProfileDoc["judaism_direction"]> = {
//   modern_orthodox: "modern",
//   "modern-orthodox": "modern",
//   modernorthodox: "modern",
//   chassidic: "chasidic",
//   chasidut: "chasidic",
// };

// const allowedDirections = new Set([
//   "orthodox",
//   "haredi",
//   "chasidic",
//   "modern",
//   "conservative",
//   "reform",
//   "reconstructionist",
//   "secular",
// ]);

// const allowedLevels = new Set(["strict", "partial", "none"]);
// const allowedGoals = new Set(["serious", "marriage", "friendship"]);

// type DatePublic = "dating-only" | "music-plus-dating" | "off";

// function toStr(v: any) {
//   return typeof v === "string" ? v : v != null ? String(v) : "";
// }
// function normStr(v: any, max = 200) {
//   return toStr(v).trim().slice(0, max);
// }
// function toStrArray(
//   v: any,
//   { lower = true, max = 12 }: { lower?: boolean; max?: number } = {}
// ) {
//   if (Array.isArray(v)) {
//     return v
//       .map((s) => toStr(s))
//       .map((s) => (lower ? s.toLowerCase() : s))
//       .map((s) => s.trim())
//       .filter(Boolean)
//       .slice(0, max);
//   }
//   if (typeof v === "string") {
//     return v
//       .split(",")
//       .map((s) => (lower ? s.toLowerCase() : s))
//       .map((s) => s.trim())
//       .filter(Boolean)
//       .slice(0, max);
//   }
//   return [];
// }

// function normDirection(
//   v: any
// ): DateProfileDoc["judaism_direction"] | undefined {
//   const raw = toStr(v).toLowerCase().trim();
//   if (!raw) return undefined;
//   const aliased = dirAliases[raw] || raw;
//   return allowedDirections.has(aliased) ? (aliased as any) : undefined;
// }

// function normLevel(v: any): "strict" | "partial" | "none" | undefined {
//   const s = toStr(v).toLowerCase().trim();
//   return allowedLevels.has(s) ? (s as any) : undefined;
// }

// function normGoalOne(v: any): DateProfileDoc["goals"] | undefined {
//   const candidate = v?.goals ?? v?.looking_for ?? v;
//   if (Array.isArray(candidate)) {
//     const arr = toStrArray(candidate, { lower: true, max: 5 }).filter((g) =>
//       allowedGoals.has(g)
//     );
//     return (arr[0] as any) || undefined;
//   }
//   const s = toStr(candidate).toLowerCase().trim();
//   return allowedGoals.has(s) ? (s as any) : undefined;
// }

// function normDatePublic(v: any): DatePublic | undefined {
//   const s = toStr(v).toLowerCase().trim();
//   return s === "dating-only" || s === "music-plus-dating" || s === "off"
//     ? (s as DatePublic)
//     : undefined;
// }

// function isISO(s?: string) {
//   return !!s && /^\d{4}-\d{2}-\d{2}T/.test(s);
// }

// function sanitize(input: any): Partial<DateProfileDoc> {
//   if (!input || typeof input !== "object") return {};
//   const out: Partial<DateProfileDoc> = {
//     // basics
//     displayName: normStr(input.displayName, 80) || undefined,

//     birthDate:
//       typeof input.birthDate === "string" &&
//       /^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)
//         ? input.birthDate
//         : undefined,

//     gender:
//       input.gender === "male" ||
//       input.gender === "female" ||
//       input.gender === "other"
//         ? input.gender
//         : undefined,

//     country: normStr(input.country, 60) || undefined,
//     city: normStr(input.city, 80) || undefined,
//     languages: (() => {
//       const arr = toStrArray(input.languages, { lower: true, max: 12 });
//       return arr.length ? arr : undefined;
//     })(),

//     jewish_by_mother:
//       typeof input.jewish_by_mother === "boolean"
//         ? input.jewish_by_mother
//         : undefined,
//     conversion:
//       typeof input.conversion === "boolean" ? input.conversion : undefined,

//     judaism_direction:
//       normDirection(input.judaism_direction ?? input.direction) || undefined,

//     kashrut_level: normLevel(input.kashrut_level),
//     shabbat_level: normLevel(input.shabbat_level),
//     tzniut_level: normLevel(input.tzniut_level),

//     goals: normGoalOne(input),

//     about_me: normStr(input.about_me, 1400) || undefined,

//     avatarUrl:
//       typeof input.avatarUrl === "string" && input.avatarUrl.startsWith("http")
//         ? input.avatarUrl
//         : undefined,

//     // ---- NEW: consents & visibility ----
//     dateEnabled:
//       typeof input.dateEnabled === "boolean" ? input.dateEnabled : undefined,
//     datePublic: normDatePublic(input.datePublic),
//     consents:
//       input.consents && typeof input.consents === "object"
//         ? {
//             tosAt: isISO(input.consents.tosAt)
//               ? input.consents.tosAt
//               : undefined,
//             privacyAt: isISO(input.consents.privacyAt)
//               ? input.consents.privacyAt
//               : undefined,
//             ageAt: isISO(input.consents.ageAt)
//               ? input.consents.ageAt
//               : undefined,
//             communityAt: isISO(input.consents.communityAt)
//               ? input.consents.communityAt
//               : undefined,
//           }
//         : undefined,
//   };

//   return out;
// }

// /* ---------- handlers ---------- */

// export async function GET() {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user)
//       return j({ ok: false, error: "unauthorized" }, { status: 401 });

//     const userId = (session.user as any).id || session.user.email!;
//     const doc = await getProfile(userId);
//     return j({ ok: true, profile: doc || null });
//   } catch (e) {
//     console.error("[GET /api/date/profile] error:", e);
//     return j({ ok: false, error: "server_error" }, { status: 500 });
//   }
// }

// async function write(req: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user)
//       return j({ ok: false, error: "unauthorized" }, { status: 401 });

//     const body = await req.json().catch(() => ({} as Record<string, unknown>));
//     const userId = (session.user as any).id || session.user.email!;
//     const email = session.user.email ?? null;

//     const patch = sanitize(body);
//     const saved = await upsertProfile(userId, { ...patch, email });

//     return j({ ok: true, profile: saved });
//   } catch (e) {
//     console.error("[WRITE /api/date/profile] error:", e);
//     return j({ ok: false, error: "server_error" }, { status: 500 });
//   }
// }

// export async function POST(req: NextRequest) {
//   return write(req);
// }
// export async function PUT(req: NextRequest) {
//   return write(req);
// }

// export async function OPTIONS() {
//   return new NextResponse(null, {
//     status: 204,
//     headers: {
//       Allow: "GET,POST,PUT,OPTIONS,HEAD",
//       "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS,HEAD",
//       "Access-Control-Allow-Headers": "content-type, authorization",
//       "Access-Control-Max-Age": "86400",
//       "Cache-Control": "no-store",
//     },
//   });
// }
// export async function HEAD() {
//   return new NextResponse(null, {
//     status: 204,
//     headers: { "Cache-Control": "no-store" },
//   });
// }

// // src/app/api/date/profile/route.ts
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import authConfig from "@/auth-config";
// import {
//   getProfile,
//   upsertProfile,
//   type DateProfileDoc,
// } from "@/lib/db/date-repo";

// /* ---------- helpers ---------- */

// function j(data: unknown, init?: ResponseInit) {
//   return NextResponse.json(data, {
//     ...init,
//     headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
//   });
// }

// const dirAliases: Record<string, DateProfileDoc["judaism_direction"]> = {
//   modern_orthodox: "modern",
//   "modern-orthodox": "modern",
//   modernorthodox: "modern",
//   chassidic: "chasidic",
//   chasidut: "chasidic",
// };

// const allowedDirections = new Set([
//   "orthodox",
//   "haredi",
//   "chasidic",
//   "modern",
//   "conservative",
//   "reform",
//   "reconstructionist",
//   "secular",
// ]);

// const allowedLevels = new Set(["strict", "partial", "none"]);
// const allowedGoals = new Set(["serious", "marriage", "friendship"]);

// type DatePublic = "dating-only" | "music-plus-dating" | "off";

// function toStr(v: any) {
//   return typeof v === "string" ? v : v != null ? String(v) : "";
// }
// function normStr(v: any, max = 200) {
//   return toStr(v).trim().slice(0, max);
// }
// function toStrArray(
//   v: any,
//   { lower = true, max = 12 }: { lower?: boolean; max?: number } = {},
// ) {
//   if (Array.isArray(v)) {
//     return v
//       .map((s) => toStr(s))
//       .map((s) => (lower ? s.toLowerCase() : s))
//       .map((s) => s.trim())
//       .filter(Boolean)
//       .slice(0, max);
//   }
//   if (typeof v === "string") {
//     return v
//       .split(",")
//       .map((s) => (lower ? s.toLowerCase() : s))
//       .map((s) => s.trim())
//       .filter(Boolean)
//       .slice(0, max);
//   }
//   return [];
// }

// function normDirection(
//   v: any,
// ): DateProfileDoc["judaism_direction"] | undefined {
//   const raw = toStr(v).toLowerCase().trim();
//   if (!raw) return undefined;
//   const aliased = (dirAliases as any)[raw] || raw;
//   return allowedDirections.has(aliased) ? (aliased as any) : undefined;
// }

// function normLevel(v: any): "strict" | "partial" | "none" | undefined {
//   const s = toStr(v).toLowerCase().trim();
//   return allowedLevels.has(s) ? (s as any) : undefined;
// }

// function normGoalOne(v: any): DateProfileDoc["goals"] | undefined {
//   const candidate = (v && (v.goals ?? v.looking_for)) ?? v;
//   if (Array.isArray(candidate)) {
//     const arr = toStrArray(candidate, { lower: true, max: 5 }).filter((g) =>
//       allowedGoals.has(g),
//     );
//     return (arr[0] as any) || undefined;
//   }
//   const s = toStr(candidate).toLowerCase().trim();
//   return allowedGoals.has(s) ? (s as any) : undefined;
// }

// function normDatePublic(v: any): DatePublic | undefined {
//   const s = toStr(v).toLowerCase().trim();
//   return s === "dating-only" || s === "music-plus-dating" || s === "off"
//     ? (s as DatePublic)
//     : undefined;
// }

// function isISO(s?: string) {
//   return !!s && /^\d{4}-\d{2}-\d{2}T/.test(s);
// }

// function unique<T>(arr: T[]) {
//   return Array.from(new Set(arr));
// }

// /**
//  * מנקה/מגביל שדות הליבה (תואם DateProfileDoc)
//  * - לא מוסיף שדות הרחבה כדי לא לשבור טיפוסי TS; הרחבות יטופלו ב-write()
//  */
// function sanitizeCore(input: any, warnings: string[]): Partial<DateProfileDoc> {
//   if (!input || typeof input !== "object") return {};
//   const out: Partial<DateProfileDoc> = {
//     // basics
//     displayName: normStr(input.displayName, 80) || undefined,

//     birthDate:
//       typeof input.birthDate === "string" &&
//       /^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)
//         ? input.birthDate
//         : undefined,

//     gender:
//       input.gender === "male" ||
//       input.gender === "female" ||
//       input.gender === "other"
//         ? input.gender
//         : undefined,

//     country: normStr(input.country, 60) || undefined,
//     city: normStr(input.city, 80) || undefined,

//     languages: (() => {
//       const arr = unique(toStrArray(input.languages, { lower: true, max: 12 }));
//       return arr.length ? arr : undefined;
//     })(),

//     jewish_by_mother:
//       typeof input.jewish_by_mother === "boolean"
//         ? input.jewish_by_mother
//         : undefined,
//     conversion:
//       typeof input.conversion === "boolean" ? input.conversion : undefined,

//     judaism_direction:
//       normDirection(input.judaism_direction ?? input.direction) || undefined,

//     kashrut_level: normLevel(input.kashrut_level),
//     shabbat_level: normLevel(input.shabbat_level),
//     tzniut_level: normLevel(input.tzniut_level),

//     goals: normGoalOne(input),

//     about_me: normStr(input.about_me, 1400) || undefined,

//     avatarUrl:
//       typeof input.avatarUrl === "string" &&
//       /^https?:\/\//i.test(input.avatarUrl)
//         ? input.avatarUrl
//         : undefined,

//     // ---- consents & visibility ----
//     dateEnabled:
//       typeof input.dateEnabled === "boolean" ? input.dateEnabled : undefined,
//     datePublic: normDatePublic(input.datePublic),
//     consents:
//       input.consents && typeof input.consents === "object"
//         ? {
//             tosAt: isISO(input.consents.tosAt)
//               ? input.consents.tosAt
//               : undefined,
//             privacyAt: isISO(input.consents.privacyAt)
//               ? input.consents.privacyAt
//               : undefined,
//             ageAt: isISO(input.consents.ageAt)
//               ? input.consents.ageAt
//               : undefined,
//             communityAt: isISO(input.consents.communityAt)
//               ? input.consents.communityAt
//               : undefined,
//           }
//         : undefined,
//   };

//   // אזהרות קטנות – אם התקבלו ערכים לא תקינים
//   if (input.birthDate && !out.birthDate)
//     warnings.push("birthDate: פורמט תקין הוא YYYY-MM-DD.");
//   if (input.avatarUrl && !out.avatarUrl)
//     warnings.push("avatarUrl: חייב להתחיל ב-http/https.");
//   if (input.kashrut_level && !out.kashrut_level)
//     warnings.push('kashrut_level: ערכים נתמכים "strict"|"partial"|"none".');
//   if (input.shabbat_level && !out.shabbat_level)
//     warnings.push('shabbat_level: ערכים נתמכים "strict"|"partial"|"none".');
//   if (input.tzniut_level && !out.tzniut_level)
//     warnings.push('tzniut_level: ערכים נתמכים "strict"|"partial"|"none".');
//   if (input.judaism_direction && !out.judaism_direction)
//     warnings.push(
//       'judaism_direction: ערכים נתמכים לדוגמה "modern","orthodox","chasidic"...',
//     );

//   return out;
// }

// /* ---------- handlers ---------- */

// export async function GET() {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user)
//       return j({ ok: false, error: "unauthorized" }, { status: 401 });

//     const userId = (session.user as any).id || session.user.email!;
//     const doc = await getProfile(userId);
//     return j({ ok: true, profile: doc || null });
//   } catch (e) {
//     console.error("[GET /api/date/profile] error:", e);
//     return j({ ok: false, error: "server_error" }, { status: 500 });
//   }
// }

// /**
//  * הרחבות לשידוכים חכמים (לא תלויות בסכימת DateProfileDoc אם היא קשיחה אצלך):
//  * - tags: string[]
//  * - wants: string[]
//  * - locationArea: string
//  * - tz: string (אם לא נשלח – ננסה לנחש מה-headers)
//  *
//  * נשמרות ע"י cast ל-any כדי לא לשבור TypeScript אם הסכמה לא עודכנה.
//  */
// function sanitizeExtras(body: any, req: NextRequest, warnings: string[]) {
//   const tags = unique(toStrArray(body?.tags, { lower: true, max: 20 }));
//   const wants = unique(toStrArray(body?.wants, { lower: true, max: 20 }));
//   const locationArea =
//     normStr(body?.locationArea ?? body?.location_area, 60) || undefined;

//   let tz =
//     normStr(body?.tz, 64) ||
//     req.headers.get("x-vercel-ip-timezone") ||
//     req.headers.get("x-tz") ||
//     undefined;
//   if (tz && !/^[A-Za-z_\/\-+0-9]+$/.test(tz)) {
//     warnings.push("tz: הוסר ערך לא תקין.");
//     tz = undefined;
//   }

//   return {
//     ...(tags.length ? { tags } : {}),
//     ...(wants.length ? { wants } : {}),
//     ...(locationArea ? { locationArea } : {}),
//     ...(tz ? { tz } : {}),
//   };
// }

// async function write(req: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user)
//       return j({ ok: false, error: "unauthorized" }, { status: 401 });

//     const body = await req.json().catch(() => ({}) as Record<string, unknown>);
//     const userId = (session.user as any).id || session.user.email!;
//     const email = session.user.email ?? null;

//     const warnings: string[] = [];
//     const core = sanitizeCore(body, warnings);
//     const extras = sanitizeExtras(body, req, warnings);

//     // מאחדים ללמסירה ל-DB; extras דרך any כדי לא לשבור TS אם DateProfileDoc לא מכיל את השדות
//     const saved = await upsertProfile(userId, {
//       ...core,
//       ...(extras as any),
//       email,
//     } as Partial<DateProfileDoc> & any);

//     return j({
//       ok: true,
//       profile: saved,
//       warnings: warnings.length ? warnings : undefined,
//     });
//   } catch (e) {
//     console.error("[WRITE /api/date/profile] error:", e);
//     return j({ ok: false, error: "server_error" }, { status: 500 });
//   }
// }

// export async function POST(req: NextRequest) {
//   return write(req);
// }
// export async function PUT(req: NextRequest) {
//   return write(req);
// }

// export async function OPTIONS() {
//   return new NextResponse(null, {
//     status: 204,
//     headers: {
//       Allow: "GET,POST,PUT,OPTIONS,HEAD",
//       "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS,HEAD",
//       "Access-Control-Allow-Headers": "content-type, authorization",
//       "Access-Control-Max-Age": "86400",
//       "Cache-Control": "no-store",
//     },
//   });
// }
// export async function HEAD() {
//   return new NextResponse(null, {
//     status: 204,
//     headers: { "Cache-Control": "no-store" },
//   });
// }

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// עוזר DB כללי: מנסה קודם getCollection, אחרת נופל ל-mongoose.collection
async function getCol(name: string) {
  try {
    const mod = await import("@/lib/db/mongo"); // אם יש לך util כזה
    if (typeof (mod as any).getCollection === "function") {
      return await (mod as any).getCollection(name);
    }
  } catch {}
  try {
    const { default: connectDB } = await import("@/lib/db/mongoose");
    await connectDB();
    const mongoose = (await import("mongoose")).default;
    return mongoose.connection.collection(name);
  } catch (e) {
    throw new Error("DB unavailable: " + (e as any)?.message);
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ userId: string }> }, // 👈 ב-Next.js 15 צריך await ל-context.params
) {
  try {
    const { userId } = await context.params; // 👈 זה התיקון
    const rawUserId = decodeURIComponent(userId);

    const profilesCol = await getCol("date_profiles");

    // חיפוש לפי userId מפורש, ואם לא — נסה גם לפי _id (ObjectId כטקסט)
    const profile =
      (await profilesCol.findOne({ userId: rawUserId })) ||
      (await profilesCol.findOne({ _id: rawUserId }));

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "Profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      profile: {
        _id: String(profile._id),
        userId: profile.userId ?? null,
        about: profile.about ?? "",
        looking_for: profile.looking_for ?? null,
        city: profile.city ?? null,
        country: profile.country ?? null,
        languages: profile.languages ?? [],
        ageMin: profile.ageMin ?? null,
        ageMax: profile.ageMax ?? null,
        hasPhoto: !!profile.hasPhoto,
        createdAt: profile.createdAt ?? null,
        updatedAt: profile.updatedAt ?? null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 },
    );
  }
}
