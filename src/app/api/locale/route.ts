// src/app/api/locale/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const lc = (url.searchParams.get("lc") || "he").toLowerCase();
    const res = NextResponse.json({ ok: true, locale: lc });
    res.headers.set(
      "Set-Cookie",
      `mm_locale=${lc}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`,
    );
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "set_locale_failed" },
      { status: 400 },
    );
  }
}
