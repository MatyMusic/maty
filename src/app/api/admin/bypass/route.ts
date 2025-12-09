// src/app/api/admin/bypass/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const c = await cookies();
  const on = c.get("mm_admin")?.value === "1";
  return NextResponse.json({ ok: true, on });
}

export async function POST(req: Request) {
  const { on } = await req.json().catch(() => ({ on: false }));
  const res = NextResponse.json({ ok: true, on: !!on });
  if (on) {
    res.cookies.set("mm_admin", "1", {
      httpOnly: false,
      secure: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  } else {
    res.cookies.set("mm_admin", "", {
      httpOnly: false,
      secure: true,
      sameSite: "Lax",
      maxAge: 0,
      path: "/",
    });
  }
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, on: false });
  res.cookies.set("mm_admin", "", {
    httpOnly: false,
    secure: true,
    sameSite: "Lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
