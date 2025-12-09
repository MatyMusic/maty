// src/app/api/debug/promos-echo/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { normalizeLocale } from "@/lib/i18n/locale";
import { listPromotions } from "@/lib/db/club-promotions";

function parseCookie(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  header.split(/; */).forEach((pair) => {
    const i = pair.indexOf("=");
    if (i > 0) {
      const k = decodeURIComponent(pair.slice(0, i).trim());
      const v = decodeURIComponent(pair.slice(i + 1).trim());
      out[k] = v;
    }
  });
  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("locale");
  const fromHeader = req.headers.get("x-app-locale");
  const fromCookie = parseCookie(req.headers.get("cookie") || "")["mm_locale"];
  const wanted = normalizeLocale(fromQuery || fromHeader || fromCookie || "he");

  const placement = url.searchParams.get("placement") || undefined;
  const items = await listPromotions({
    placement,
    activeOnly: true,
    limit: 50,
  });

  const echo = items.map((p: any) => ({
    _id: p._id,
    title: p.title,
    locales: p.locales || [],
    locales_norm: (p.locales || []).map(normalizeLocale),
  }));

  return NextResponse.json({
    ok: true,
    resolved: { fromQuery, fromHeader, fromCookie, wanted },
    placement,
    sample: echo,
  });
}
