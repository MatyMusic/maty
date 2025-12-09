// src/app/api/date/me/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import DateProfile from "@/models/DateProfile";

/* ====================== Helpers ====================== */
type Genre = "chabad" | "mizrahi" | "soft" | "fun";
type Strategy = "genre" | "gallery" | "upload" | "profile";

const ALLOWED_GENRES = new Set<Genre>(["chabad", "mizrahi", "soft", "fun"]);
const isGenre = (g: any): g is Genre => ALLOWED_GENRES.has(g);

const j = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });

function safeDisplayName(u: any): string {
  const name =
    u?.displayName?.trim?.() ||
    u?.name?.trim?.() ||
    u?.fullName?.trim?.() ||
    [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() ||
    (typeof u?.email === "string" && u.email.includes("@")
      ? u.email.split("@")[0]
      : "");
  return name || (u?._id ? `משתמש ${String(u._id).slice(0, 6)}` : "משתמש");
}

function deriveAvatarUrl(u: any): string | null {
  // סדר עדיפויות: upload/profile/gallery/genre -> url
  if (typeof u?.avatarUrl === "string" && u.avatarUrl) return u.avatarUrl;
  if (typeof u?.image === "string" && u.image) return u.image; // OAuth
  // מפה ל-gallery/genre (תמונות ברירת מחדל)
  const galleryMap: Record<string, string> = {
    "avatar-chabad": "/assets/images/avatar-chabad.png",
    "avatar-mizrahi": "/assets/images/avatar-mizrahi.png",
    "avatar-soft": "/assets/images/avatar-soft.png",
    "avatar-fun": "/assets/images/avatar-fun.png",
  };
  if (u?.avatarId && galleryMap[u.avatarId]) return galleryMap[u.avatarId];
  const byGenre: Record<Genre, string> = {
    chabad: "/assets/images/avatar-chabad.png",
    mizrahi: "/assets/images/avatar-mizrahi.png",
    soft: "/assets/images/avatar-soft.png",
    fun: "/assets/images/avatar-fun.png",
  };
  if (isGenre(u?.lastPlayedGenre)) return byGenre[u.lastPlayedGenre];
  if (Array.isArray(u?.preferredGenres)) {
    const first = (u.preferredGenres as any[]).find(isGenre);
    if (first) return byGenre[first as Genre];
  }
  return "/assets/images/avatar-soft.png";
}

const pickUser = (u: any) => ({
  id: String(u?._id || ""),
  name: safeDisplayName(u),
  email: u?.email || "",
  phone: u?.phone || "",
  role: u?.role || "user",
  image: typeof u?.image === "string" ? u.image : null,
  avatarUrl: deriveAvatarUrl(u),
  avatarStrategy: u?.avatarStrategy || "genre",
  avatarId: typeof u?.avatarId === "string" ? u.avatarId : null,
  preferredGenres: Array.isArray(u?.preferredGenres) ? u.preferredGenres : [],
  lastPlayedGenre: isGenre(u?.lastPlayedGenre) ? u.lastPlayedGenre : null,
});

const pickDate = (p: any) =>
  !p
    ? null
    : {
        userId: String(p.userId),
        displayName: p.displayName || "",
        email: p.email || "",
        avatarUrl: p.avatarUrl || null,
        photos: Array.isArray(p.photos) ? p.photos : [],
        gender: p.gender || null,
        languages: Array.isArray(p.languages) ? p.languages : [],
        judaism_direction: p.judaism_direction || null,
        kashrut_level: p.kashrut_level || null,
        shabbat_level: p.shabbat_level || null,
        tzniut_level: p.tzniut_level || null,
        subscription: p.subscription || null,
        updatedAt: p.updatedAt || null,
        trust: p.trust ?? null,
      };

/* ====================== GET /api/date/me ====================== */
export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authConfig);
    const email = session?.user?.email;
    if (!email) return j({ ok: false, error: "unauthorized" }, { status: 401 });

    const me = await User.findOne({ email }).lean();
    if (!me) return j({ ok: false, error: "not_found" }, { status: 404 });

    const userId = String(me._id);
    const date = await DateProfile.findOne({ userId }).lean();

    const resp = {
      ok: true,
      me: pickUser(me),
      date: {
        hasProfile: !!date,
        profile: pickDate(date),
      },
    };

    return j(resp);
  } catch (err) {
    console.error("[GET /api/date/me] error:", err);
    return j({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

/* ====================== POST /api/date/me ====================== */
/** יוצר/מעדכן פרופיל MATY-DATE מתוך חשבון המשתמש (onboarding/sync) */
export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authConfig);
    const email = session?.user?.email;
    if (!email) return j({ ok: false, error: "unauthorized" }, { status: 401 });

    const me = await User.findOne({ email }).lean();
    if (!me) return j({ ok: false, error: "not_found" }, { status: 404 });

    const payload = (await req.json().catch(() => ({}))) as Partial<{
      displayName: string;
      languages: string[];
      copyMusicTaste: boolean; // עתידי: לשדכן מהז’אנרים
    }>;

    const userId = String(me._id);
    const displayName =
      (payload.displayName || "").trim() || safeDisplayName(me);
    const avatarUrl = deriveAvatarUrl(me);

    const base: any = {
      userId,
      displayName,
      email: me.email,
      avatarUrl,
    };

    if (Array.isArray(payload.languages)) base.languages = payload.languages;

    const doc = await DateProfile.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: { createdAt: new Date() },
        $set: { ...base, updatedAt: new Date() },
      },
      { upsert: true, new: true }
    ).lean();

    return j({
      ok: true,
      me: pickUser(me),
      date: { hasProfile: true, profile: pickDate(doc) },
    });
  } catch (err) {
    console.error("[POST /api/date/me] error:", err);
    return j({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
