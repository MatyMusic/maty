// src/app/api/admin/roles/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth";
import db from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: Request) {
  const { isSuperAdmin } = await getServerAuth();
  if (!isSuperAdmin)
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );

  await db;
  const { email, role } = await req.json();
  const e = String(email || "")
    .trim()
    .toLowerCase();
  if (!e || !["admin", "user"].includes(role)) {
    return NextResponse.json(
      { ok: false, error: "Bad request" },
      { status: 400 }
    );
  }

  const doc = await User.findOneAndUpdate(
    { email: e },
    {
      $set: { role, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date(), email: e },
    },
    { upsert: true, new: true, projection: "name email role" }
  ).lean();

  // חשוב: כדי שהמשתמש יקבל את התפקיד החדש, הוא צריך לבצע Sign out/in
  return NextResponse.json({
    ok: true,
    user: doc,
    note: "User must re-login to refresh role",
  });
}
