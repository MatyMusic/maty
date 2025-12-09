// src/app/api/date/video/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { getDb } from "@/lib/mongodb";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user)
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    const userId = (session.user as any).id || session.user.email!;

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return j({ ok: false, error: "file_required" }, { status: 400 });

    // נקבל webm/mp4
    const type = String(file.type || "").toLowerCase();
    if (
      !type.startsWith("video/") ||
      (!type.includes("webm") &&
        !type.includes("mp4") &&
        !type.includes("quicktime"))
    ) {
      return j({ ok: false, error: "unsupported_type" }, { status: 400 });
    }

    // שמירה לדיסק
    const buf = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "video-intros"
    );
    await fs.mkdir(uploadDir, { recursive: true });
    const ext = type.includes("mp4") ? ".mp4" : ".webm";
    const name = `${Date.now()}_${randomBytes(6).toString("hex")}${ext}`;
    const abs = path.join(uploadDir, name);
    await fs.writeFile(abs, buf);

    const url = `/uploads/video-intros/${name}`;

    // עדכון הפרופיל (ישירות לקולקשן כדי לא לשבור טיפוסים)
    const db = await getDb();
    await db.collection("date_profiles").updateOne(
      { userId },
      {
        $setOnInsert: { userId, createdAt: new Date().toISOString() },
        $set: { videoIntroUrl: url, updatedAt: new Date().toISOString() },
      },
      { upsert: true }
    );

    return j({ ok: true, url });
  } catch (err) {
    console.error("[POST /api/date/video] error:", err);
    return j({ ok: false, error: "upload_failed" }, { status: 500 });
  }
}
