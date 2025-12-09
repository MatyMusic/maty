// src/app/api/date/profile/[userId]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getCollection } from "@/lib/db";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

const j = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });

function isValidObjectId(s?: string) {
  return !!s && /^[a-fA-F0-9]{24}$/.test(s);
}

// לפעמים הפרמטר עובר קידוד כפול (%253A וכד')
function safeDecode(input: string) {
  try {
    const once = decodeURIComponent(input);
    // אם עדיין יש אחוזים משמעותיים – נסה שוב
    if (/%[0-9A-Fa-f]{2}/.test(once)) {
      try {
        return decodeURIComponent(once);
      } catch {
        return once;
      }
    }
    return once;
  } catch {
    return input;
  }
}

// מאחד מידע מפרופיל ומה־User ל־displayName אמין
function presentProfile(p: any, u?: any) {
  const dn =
    p?.displayName?.trim?.() ||
    p?.name?.trim?.() ||
    u?.name?.trim?.() ||
    p?.username?.trim?.() ||
    (p?.email && typeof p.email === "string" && p.email.includes("@")
      ? p.email.split("@")[0]
      : null);

  const updatedAt =
    (p?.updatedAt instanceof Date && p.updatedAt.toISOString()) ||
    (typeof p?.updatedAt === "string" ? p.updatedAt : null);

  return {
    userId: String(p?.userId || p?._id || ""),
    displayName: dn || null,
    email: p?.email ?? u?.email ?? null,
    city: p?.city ?? null,
    country: p?.country ?? null,
    birthDate: p?.birthDate ?? null,
    gender: p?.gender ?? null,
    languages: Array.isArray(p?.languages) ? p.languages : [],
    judaism_direction: p?.judaism_direction ?? null,
    kashrut_level: p?.kashrut_level ?? null,
    shabbat_level: p?.shabbat_level ?? null,
    tzniut_level: p?.tzniut_level ?? null, // שם שדה אחד ברור
    goals: p?.goals ?? null,
    about_me: p?.about_me ?? "",
    photos: Array.isArray(p?.photos) ? p.photos : [],
    avatarUrl: p?.avatarUrl ?? u?.avatarUrl ?? null,
    verified: !!p?.verified,
    online: !!p?.online,
    subscription: p?.subscription ?? null,
    updatedAt,
    audioGreetingUrl: p?.audioGreetingUrl ?? null,
    distanceKm: p?.distanceKm ?? null,
    trust: typeof p?.trust === "number" ? p.trust : null,
  };
}

// ➜ שים לב לחתימה: params הוא Promise וצריך await לפי Next.js 15
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await ctx.params; // ← זה הפתרון ל-Dynamic APIs
    const rawUserId = safeDecode(userId);

    // פרופיל דייטינג לפי userId (שדה מפורש) או לפי _id
    const profilesCol = await getCollection("date_profiles");
    const prof =
      (await profilesCol.findOne({ userId: rawUserId })) ||
      (isValidObjectId(rawUserId)
        ? await profilesCol.findOne({ _id: new ObjectId(rawUserId) })
        : null);

    if (!prof) return j({ ok: false, error: "not_found" }, { status: 404 });

    // נסה להביא משתמש מ-MATY-MUSIC כדי לחלץ שם/אווטאר
    const usersCol = await getCollection("users");
    let user: any = null;

    if (prof.email) {
      user = await usersCol.findOne({ email: prof.email });
    }

    if (!user) {
      if (isValidObjectId(rawUserId)) {
        user = await usersCol.findOne({ _id: new ObjectId(rawUserId) });
      }
      if (!user) {
        user =
          (await usersCol.findOne({ userId: rawUserId })) ||
          (await usersCol.findOne({ externalId: rawUserId }));
      }
    }

    const profile = presentProfile(prof, user);

    // אין תמונות? משוך אווטאר מה-User
    if ((!profile.photos || profile.photos.length === 0) && user?.avatarUrl) {
      profile.photos = [user.avatarUrl];
      profile.avatarUrl = user.avatarUrl;
    }

    // מוזיקה אם קיימת
    const music: Array<{ title: string; artist?: string }> = Array.isArray(
      prof?.music,
    )
      ? prof.music.map((m: any) => ({
          title: String(m?.title || ""),
          artist: m?.artist ? String(m.artist) : undefined,
        }))
      : [];

    return j({ ok: true, profile, music });
  } catch (e) {
    console.error("[GET /api/date/profile/[userId]] error:", e);
    return j({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
