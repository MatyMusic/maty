export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options"; // ודא שזה הנתיב שלך
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

/* ================== Helpers & Types ================== */
type Genre = "chabad" | "mizrahi" | "soft" | "fun";
type Strategy = "genre" | "gallery" | "upload" | "profile";

const ALLOWED_GENRES = new Set<Genre>(["chabad", "mizrahi", "soft", "fun"]);
const ALLOWED_STRATEGY = new Set<Strategy>([
  "genre",
  "gallery",
  "upload",
  "profile",
]);

const isGenre = (g: any): g is Genre => ALLOWED_GENRES.has(g);
const isStrategy = (s: any): s is Strategy => ALLOWED_STRATEGY.has(s);

const safeStr = (v: unknown, max = 120) =>
  typeof v === "string" ? v.slice(0, max) : undefined;

const sanitizeUrl = (u: unknown, max = 1024): string | undefined => {
  if (typeof u !== "string") return undefined;
  const s = u.trim().slice(0, max);
  if (/^https?:\/\//i.test(s) || s.startsWith("/")) return s;
  return undefined;
};

const j = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });

const pickUser = (u: any) => ({
  name: u?.name || "",
  email: u?.email || "",
  phone: u?.phone || "",
  avatarStrategy: (u?.avatarStrategy as Strategy) || "genre",
  avatarId:
    typeof u?.avatarId === "string" || u?.avatarId === null ? u.avatarId : null,
  avatarUrl:
    typeof u?.avatarUrl === "string" || u?.avatarUrl === null
      ? u.avatarUrl
      : null,
  preferredGenres: Array.isArray(u?.preferredGenres)
    ? u.preferredGenres.filter(isGenre)
    : [],
  lastPlayedGenre: isGenre(u?.lastPlayedGenre) ? u.lastPlayedGenre : null,
  role: u?.role || "user",
});

/* ================== GET /api/me ================== */
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions as any);
    const email = session?.user?.email;
    if (!email) return j({ ok: false, error: "unauthorized" }, { status: 401 });

    const me = await User.findOne({ email }).lean();
    if (!me) return j({ ok: false, error: "not_found" }, { status: 404 });

    return j({ ok: true, user: pickUser(me) });
  } catch (err) {
    console.error("[GET /api/me] error:", err);
    return j({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

/* ================== PUT /api/me ==================
   תומך:
   - JSON body (Content-Type: application/json)
   - FormData עם קובץ תמונה בשם "avatar"
   מחזיר תמיד { ok, user, image? }
==================================================== */
export async function PUT(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions as any);
    const email = session?.user?.email;
    if (!email) return j({ ok: false, error: "unauthorized" }, { status: 401 });

    const ct = req.headers.get("content-type") || "";
    const update: Record<string, any> = {};
    let uploadedImageUrl: string | null = null;

    // ---- מסלול FormData (העלאת קובץ) ----
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      // תמונה
      const file = form.get("avatar") as File | null;
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        const hash = createHash("sha1").update(buf).digest("hex").slice(0, 16);
        const ext =
          file.type && file.type.includes("png")
            ? "png"
            : file.type && file.type.includes("jpeg")
              ? "jpg"
              : "png";
        const dir = join(process.cwd(), "public", "uploads", "avatars");
        await mkdir(dir, { recursive: true });
        const filename = `${hash}.${ext}`;
        await writeFile(join(dir, filename), buf);
        uploadedImageUrl = `/uploads/avatars/${filename}`;

        update.avatarStrategy = "upload";
        update.avatarUrl = uploadedImageUrl;
        update.avatarId = null;
      }

      // שדות טקסט אופציונליים
      const nameStr = safeStr(form.get("name")?.toString());
      if (typeof nameStr !== "undefined") update.name = nameStr;

      const phoneStr = safeStr(form.get("phone")?.toString(), 40);
      if (typeof phoneStr !== "undefined") update.phone = phoneStr;

      const strategy = form.get("avatarStrategy")?.toString();
      if (isStrategy(strategy)) update.avatarStrategy = strategy;

      const aid = form.get("avatarId");
      if (typeof aid === "string" || aid === null)
        update.avatarId = aid ?? null;

      const aurlRaw = form.get("avatarUrl");
      if (typeof aurlRaw === "string" || aurlRaw === null) {
        const url = aurlRaw === null ? null : sanitizeUrl(aurlRaw);
        if (typeof url !== "undefined") update.avatarUrl = url;
      }
    }
    // ---- מסלול JSON ----
    else {
      const body = (await req.json().catch(() => ({}))) as Partial<{
        name: string;
        phone: string;
        avatarStrategy: Strategy;
        avatarId: string | null;
        avatarUrl: string | null;
        preferredGenres: Genre[];
        lastPlayedGenre: Genre | null;
      }>;

      const nameStr = safeStr(body.name, 120);
      if (typeof nameStr !== "undefined") update.name = nameStr;

      const phoneStr = safeStr(body.phone, 40);
      if (typeof phoneStr !== "undefined") update.phone = phoneStr;

      if (isStrategy(body.avatarStrategy))
        update.avatarStrategy = body.avatarStrategy;

      if (typeof body.avatarId === "string" || body.avatarId === null)
        update.avatarId = body.avatarId ?? null;

      if (typeof body.avatarUrl === "string" || body.avatarUrl === null) {
        const url =
          body.avatarUrl === null ? null : sanitizeUrl(body.avatarUrl);
        if (typeof url !== "undefined") update.avatarUrl = url;
      }

      if (Array.isArray(body.preferredGenres)) {
        const genres = body.preferredGenres.filter(isGenre);
        if (genres.length > 0) update.preferredGenres = genres;
        else if (body.preferredGenres.length === 0) update.preferredGenres = [];
      }

      if (isGenre(body.lastPlayedGenre))
        update.lastPlayedGenre = body.lastPlayedGenre;
      else if (body.lastPlayedGenre === null) update.lastPlayedGenre = null;
    }

    // אין עדכונים? החזר מצב נוכחי
    if (Object.keys(update).length === 0) {
      const cur = await User.findOne({ email }).lean();
      if (!cur) return j({ ok: false, error: "not_found" }, { status: 404 });
      return j({ ok: true, user: pickUser(cur) });
    }

    const doc = await User.findOneAndUpdate(
      { email },
      { $set: update },
      { new: true },
    ).lean();
    if (!doc) return j({ ok: false, error: "not_found" }, { status: 404 });

    return j({
      ok: true,
      user: pickUser(doc),
      image: uploadedImageUrl || doc.avatarUrl || null,
    });
  } catch (err) {
    console.error("[PUT /api/me] error:", err);
    return j({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
