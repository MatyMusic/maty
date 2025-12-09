// src/app/api/admin/unbypass/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("mm-admin", "", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: false,
    maxAge: 0,
  });
  res.cookies.set("maty_admin_bypass", "", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: false,
    maxAge: 0,
  });
  return res;
}
