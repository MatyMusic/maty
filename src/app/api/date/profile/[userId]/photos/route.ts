export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const j = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });

// דה-קוד בטוח נגד %253A וכו'
function deepDecode(s: string) {
  try {
    const once = decodeURIComponent(s);
    return once.includes("%") ? decodeURIComponent(once) : once;
  } catch {
    return s;
  }
}

// שמירת קובץ ל-/public/uploads
async function saveFileToUploads(file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const safeExt = ext.match(/^[a-z0-9]{1,8}$/) ? `.${ext}` : "";
  const name = `${Date.now()}-${crypto
    .randomBytes(8)
    .toString("hex")}${safeExt}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const full = path.join(uploadsDir, name);
  await fs.writeFile(full, bytes, { flag: "wx" });

  // ה-URL הציבורי שהדפדפן ישתמש בו
  return `/uploads/${name}`;
}

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = deepDecode(params.userId);
    const form = await req.formData();

    // תמיכה גם ב-"files" וגם ב-"files[]"
    const files: File[] = [
      ...(form.getAll("files") as any[]),
      ...(form.getAll("files[]") as any[]),
    ].filter((f): f is File => f instanceof File);

    if (!files.length) {
      return j({ ok: false, error: "no_files" }, { status: 400 });
    }

    // שמירה לדיסק ויצירת URL-ים
    const urls: string[] = [];
    for (const f of files.slice(0, 24)) {
      const url = await saveFileToUploads(f);
      urls.push(url);
    }

    // עדכון הפרופיל
    const col = await getCollection("date_profiles");
    await col.updateOne(
      { userId },
      {
        $set: { updatedAt: new Date() },
        $push: { photos: { $each: urls } },
      }
    );

    return j({ ok: true, urls });
  } catch (e) {
    console.error("[POST photos] error:", e);
    return j({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = deepDecode(params.userId);
    const body = await req.json().catch(() => ({}));
    const url: string | undefined = body?.url;

    if (!url || typeof url !== "string")
      return j({ ok: false, error: "missing_url" }, { status: 400 });

    const col = await getCollection("date_profiles");

    // משוך את הפרופיל כדי לבדוק אם זו תמונת אווטאר קיימת
    const prof = await col.findOne({ userId });
    if (!prof) return j({ ok: false, error: "not_found" }, { status: 404 });

    // הסרה מהמסמך
    const update: any = {
      $pull: { photos: url },
      $set: { updatedAt: new Date() },
    };
    if (prof.avatarUrl === url) {
      update.$unset = { ...update.$unset, avatarUrl: "" };
    }
    await col.updateOne({ userId }, update);

    // מחיקת קובץ מקומי רק אם הוא תחת /uploads
    if (url.startsWith("/uploads/")) {
      const full = path.join(process.cwd(), "public", url);
      try {
        await fs.unlink(full);
      } catch {
        // אם כבר הוסר — לא נכשלים
      }
    }

    return j({ ok: true });
  } catch (e) {
    console.error("[DELETE photos] error:", e);
    return j({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
