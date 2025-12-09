// src/app/api/user/avatar/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import cloudinary from "@/lib/cloudinary";

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  "";

// אם אין חתימה — נשתמש ב־unsigned preset
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "maty_unsigned";

// לארגון בתיקיות
const UPLOAD_FOLDER =
  process.env.CLOUDINARY_UPLOAD_FOLDER || "maty-music/avatars";

// הגבלת גודל: 2MB (אפשר לשנות)
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

// בדיקה אם יש מפתחות חתימה זמינים (SDK כבר מוגדר ב- lib/cloudinary.ts)
const HAS_SIGNING =
  !!process.env.CLOUDINARY_API_KEY && !!process.env.CLOUDINARY_API_SECRET;

type OkJson = {
  ok: true;
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
};
type ErrJson = { ok: false; error: string; [k: string]: unknown };

function json(data: OkJson | ErrJson, init?: ResponseInit) {
  // תמיד נחזיר JSON תקין כדי לא להפיל את הלקוח על JSON.parse
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers || {}),
    },
  });
}

export async function POST(req: Request) {
  try {
    // דרישת התחברות (תואם דף הפרופיל שלך שמוגן ממילא)
    const session = await getServerSession(authConfig);
    if (!session?.user)
      return json({ ok: false, error: "unauthorized" }, { status: 401 });

    if (!CLOUD_NAME) {
      return json(
        { ok: false, error: "cloudinary_not_configured" },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return json({ ok: false, error: "missing_file" }, { status: 400 });
    }

    // @ts-ignore Next App Router מספק File תקין
    const f: File = file;

    if (!f.type.startsWith("image/")) {
      return json({ ok: false, error: "invalid_type" }, { status: 415 });
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      return json(
        { ok: false, error: "too_large", limit: MAX_UPLOAD_BYTES },
        { status: 413 }
      );
    }

    // נזהה משתמש לתיקיית קבצים
    const userId =
      ((session.user as any)?.id as string) ||
      (session.user.email as string) ||
      "anon";

    const folder = `${UPLOAD_FOLDER}/${userId}`;

    // ========= העדפה: העלאה חתומה באמצעות SDK =========
    if (HAS_SIGNING) {
      const arrayBuf = await f.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      const res = await new Promise<OkJson>((resolve, reject) => {
        // שימוש ב-upload_stream כדי להזין Buffer
        cloudinary.uploader
          .upload_stream(
            {
              folder,
              resource_type: "image",
              // public_id אוטומטי; אפשר להגדיר: public_id: `${Date.now()}`,
              overwrite: true,
              invalidate: true,
            },
            (err, result) => {
              if (err || !result) {
                return reject(err || new Error("cloudinary_result_empty"));
              }
              resolve({
                ok: true,
                url: String(result.secure_url),
                publicId: String(result.public_id),
                width: result.width,
                height: result.height,
                format: result.format,
              });
            }
          )
          .end(buffer);
      });

      return json(res);
    }

    // ========= נפילה ל-unsigned preset (ללא חתימה) =========
    if (!UPLOAD_PRESET) {
      return json(
        { ok: false, error: "unsigned_preset_missing" },
        { status: 500 }
      );
    }

    // נשלח ל-Cloudinary דרך השרת (Proxy) כדי להימנע מצרות CORS
    const cloudForm = new FormData();
    cloudForm.append("file", f);
    cloudForm.append("upload_preset", UPLOAD_PRESET);
    cloudForm.append("folder", folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const upRes = await fetch(uploadUrl, { method: "POST", body: cloudForm });
    const data = await upRes.json().catch(() => null);

    if (!upRes.ok || !data?.secure_url) {
      return json(
        { ok: false, error: "cloudinary_upload_failed", details: data || null },
        { status: upRes.status || 400 }
      );
    }

    return json({
      ok: true,
      url: String(data.secure_url),
      publicId: String(data.public_id),
      width: data.width,
      height: data.height,
      format: data.format,
    });
  } catch (e: any) {
    console.error("[/api/user/avatar] error:", e?.message || e);
    return json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

// איפוס בצד שרת — אין מחיקה ב־unsigned; עבור חתום אפשר להוסיף מחיקה עתידית.
// משאירים את הממשק כפי שהפרונט מצפה לו.
export async function DELETE() {
  return json({ ok: true });
}
