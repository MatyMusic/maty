// דף מלא
import { NextResponse } from "next/server";
import { filterPromosByLocale, type Promo } from "@/lib/promos/filter";
import { normalizeLocale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic"; // בלי קאש
export const revalidate = 0; // בלי ISR
export const fetchCache = "force-no-store"; // בלי שימור Fetch

const COOKIE_NAME = "md:promos:v1";
const LOCALE_HEADER = "x-app-locale"; // נביא מהלקוח

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qLocale =
    url.searchParams.get("locale") || req.headers.get(LOCALE_HEADER) || "he-IL";

  // קרא מהקוקיז של הבקשה (Server)
  // שים לב: ב־route handlers אין next/headers.cookies, אז נקרא ידנית:
  const cookieHeader = req.headers.get("cookie") || "";
  const raw = parseCookie(cookieHeader)[COOKIE_NAME];
  let items: Promo[] = [];
  try {
    if (raw) items = JSON.parse(raw);
  } catch {}

  const filtered = filterPromosByLocale(items, normalizeLocale(qLocale));
  return NextResponse.json({ ok: true, items: filtered });
}

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
