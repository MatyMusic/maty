// // src/app/api/auth/register/route.ts
// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// import bcrypt from "bcryptjs";
// import { NextResponse } from "next/server";

// import db from "@/lib/mongoose";
// import AuditEvent from "@/models/AuditEvent";
// import User from "@/models/User";

// function j(data: any, status = 200) {
//   return NextResponse.json(data, {
//     status,
//     headers: { "Cache-Control": "no-store" },
//   });
// }

// export async function POST(req: Request) {
//   try {
//     const body = await req.json().catch(() => null);
//     if (!body || typeof body !== "object") {
//       return j({ ok: false, error: "server_error" }, 400);
//     }

//     const name = String(body.name || "").trim();
//     const emailRaw = String(body.email || "").trim();
//     const password = String(body.password || "");
//     const phone = String(body.phone || "").trim();
//     const next = typeof body.next === "string" ? body.next : "/";

//     if (!name || !emailRaw || !password) {
//       return j({ ok: false, error: "missing_fields" }, 400);
//     }

//     const email = emailRaw.toLowerCase();
//     const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRe.test(email)) {
//       return j({ ok: false, error: "bad_email" }, 400);
//     }

//     if (password.length < 8) {
//       return j({ ok: false, error: "weak_password" }, 400);
//     }

//     await db();

//     // כבר רשום?
//     const existing = await User.findOne({ email }).lean();
//     if (existing) {
//       return j({ ok: false, error: "email_exists" }, 409);
//     }

//     const hash = await bcrypt.hash(password, 10);

//     const doc = await User.create({
//       name,
//       email,
//       phone,
//       passwordHash: hash, // ⬅⬅ חשוב: אותו שם כמו ב-CredentialsProvider
//       role: "user",
//     });

//     try {
//       await AuditEvent.create({
//         type: "auth.register",
//         userId: String(doc._id),
//         email,
//         ip: "",
//         ua: "",
//         meta: { source: "register_form" },
//       });
//     } catch {}

//     return j({
//       ok: true,
//       redirectTo: next || "/",
//     });
//   } catch (e: any) {
//     console.error("[POST /api/auth/register] error:", e);
//     return j({ ok: false, error: "server_error" }, 500);
//   }
// }

// src/app/api/auth/register/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/mongoose";
import User from "@/models/User";

/** אימיילים שהם אדמין כבר מהרישום (אופציונלי) */
function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = String(process.env.ADMIN_EMAILS || "")
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map((s) => s.trim().toLowerCase());
  return list.includes(String(email).trim().toLowerCase());
}

function j(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}) as any);

    const rawEmail = String(body.email || "").trim();
    const email = rawEmail.toLowerCase();
    const name = String(body.name || "")
      .trim()
      .slice(0, 80);
    const password = String(body.password || "");
    const phone = String(body.phone || "").trim();
    const preferredGenres: string[] = Array.isArray(body.preferredGenres)
      ? body.preferredGenres.map((s: any) => String(s))
      : [];

    const next =
      typeof body.next === "string"
        ? body.next
        : req.nextUrl.searchParams.get("next") || "/";

    if (!email || !password) {
      return j({ ok: false, error: "missing_fields" }, 400);
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return j({ ok: false, error: "bad_email" }, 400);
    }

    if (password.length < 8) {
      return j({ ok: false, error: "weak_password" }, 400);
    }

    await db();

    // האם כבר קיים משתמש עם אותו אימייל?
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return j({ ok: false, error: "email_exists" }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = isAdminEmail(email) ? "admin" : "user";

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash, // זה חייב להתאים ל־CredentialsProvider
      role,
      preferredGenres,
    } as any);

    return j(
      {
        ok: true,
        id: String(user._id),
        role,
        redirectTo: next,
      },
      201,
    );
  } catch (err) {
    console.error("[POST /api/auth/register] error:", err);
    return j({ ok: false, error: "server_error" }, 500);
  }
}
