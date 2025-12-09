// src/app/api/upload/route.ts
import { NextResponse } from "next/server";

/**
 * API העלאה מינימלי: מקבל FormData("file") ומחזיר data:URL
 * פתרון מקומי/דמו – אין אחסון קבוע. מספיק כדי לרוץ עכשיו,
 * עובד נהדר לתצוגת תמונה בצ'אט.
 */
export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json(
        { ok: false, error: "bad_content_type" },
        { status: 400 }
      );
    }
    const form = await req.formData();
    const f = form.get("file");
    if (!(f instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "missing_file" },
        { status: 400 }
      );
    }

    // מגבלה בסיסית
    if (f.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "file_too_big" },
        { status: 413 }
      );
    }

    const buf = Buffer.from(await f.arrayBuffer());
    // נזהה mime, ניפול ל-image/jpeg אם לא בטוח
    const mime =
      f.type ||
      (buf[0] === 0x89 && buf[1] === 0x50 ? "image/png" : "image/jpeg");

    const b64 = buf.toString("base64");
    const url = `data:${mime};base64,${b64}`;

    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "upload_failed" },
      { status: 500 }
    );
  }
}
