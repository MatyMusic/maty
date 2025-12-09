// src/app/api/auth/register/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/mongoose";
import User from "@/models/User";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function json(data: any, status = 200, headers: Record<string, string> = {}) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}
function jsonError(code: string, message: string, status = 400, debug?: any) {
  return json(
    { ok: false, code, error: message, ...(debug ? { debug } : {}) },
    status,
    {
      "X-Error-Code": code,
    }
  );
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const debugOn = url.searchParams.get("debug") === "1";

  try {
    await db;

    const contentType = req.headers.get("content-type") || "";
    const raw = await req.text();

    let body: any = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (e: any) {
      return jsonError(
        "invalid_json",
        "הגוף שנשלח אינו JSON תקין",
        400,
        debugOn
          ? { raw, contentType, parseError: String(e?.message || e) }
          : undefined
      );
    }

    const nameRaw = String(body?.name ?? "").trim();
    const emailRaw = String(body?.email ?? "")
      .trim()
      .toLowerCase();
    const phoneRaw = String(body?.phone ?? "").trim();
    const passwordRaw = String(body?.password ?? "");
    const styleRaw = String(body?.style ?? "")
      .trim()
      .toLowerCase();
    const avatarIdRaw = body?.avatarId ? String(body.avatarId) : undefined;

    const reqId =
      req.headers.get("x-request-id") ||
      Math.random().toString(36).slice(2) + Date.now().toString(36);

    console.log("[REGISTER] incoming", {
      hasName: !!nameRaw,
      hasEmail: !!emailRaw,
      hasPhone: !!phoneRaw,
      pwLen: passwordRaw.length,
      style: styleRaw || "(none)",
      hasAvatarId: !!avatarIdRaw,
      contentType,
      ip: req.headers.get("x-forwarded-for") || (req as any).ip || "",
      ua: req.headers.get("user-agent") || "",
      reqId,
    });

    if (!emailRaw) return jsonError("missing_email", "חובה למלא אימייל", 400);
    if (!passwordRaw)
      return jsonError("missing_password", "חובה למלא סיסמה", 400);
    if (!isValidEmail(emailRaw))
      return jsonError("invalid_email", "אימייל אינו תקין", 400);
    if (passwordRaw.length < 6)
      return jsonError(
        "short_password",
        "הסיסמה קצרה מדי (לפחות 6 תווים)",
        400
      );

    const exists: any = await User.findOne({ email: emailRaw }).lean();
    const passwordHash = await bcrypt.hash(passwordRaw, 10);

    // משתמש קיים?
    if (exists) {
      // אם אין לו סיסמה (למשל נוצר ב-Google בלבד) → משדרגים
      if (!exists.passwordHash) {
        await User.updateOne(
          { email: emailRaw },
          {
            $set: {
              passwordHash,
              name: nameRaw || exists.name || emailRaw.split("@")[0],
              phone: phoneRaw || exists.phone || undefined,
              status: exists.status || "active",
              role: exists.role || "user",
              ...(styleRaw ? { style: styleRaw } : {}),
              ...(avatarIdRaw ? { avatarId: avatarIdRaw } : {}),
            },
          }
        );

        console.log("[REGISTER] upgraded_user ✅", {
          ok: true,
          userId: exists?._id?.toString(),
          email: emailRaw,
          style: styleRaw || exists?.style,
          avatarId: avatarIdRaw || exists?.avatarId,
          reqId,
        });

        return json({ ok: true, upgraded: true }, 200);
      }

      return jsonError("email_exists", "האימייל כבר רשום במערכת", 409);
    }

    // יצירה חדשה
    const doc = await User.create({
      name: nameRaw || emailRaw.split("@")[0],
      email: emailRaw,
      phone: phoneRaw || undefined,
      passwordHash,
      role: "user",
      status: "active",
      ...(styleRaw ? { style: styleRaw } : {}),
      ...(avatarIdRaw ? { avatarId: avatarIdRaw } : {}),
    });

    console.log("[REGISTER] created_user ✅", {
      ok: true,
      userId: doc?._id?.toString(),
      email: emailRaw,
      style: styleRaw || undefined,
      avatarId: avatarIdRaw || undefined,
      reqId,
    });

    return json({ ok: true }, 201);
  } catch (err: any) {
    console.error("[REGISTER] server_error", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    });

    if (err?.code === 11000) {
      return jsonError("email_exists", "האימייל כבר רשום במערכת", 409);
    }
    return jsonError(
      "server_error",
      "שגיאת שרת",
      500,
      debugOn
        ? { name: err?.name, message: err?.message, code: err?.code }
        : undefined
    );
  }
}
