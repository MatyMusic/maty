// app/api/proxy/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // לא Edge – צריך streaming + Range
export const dynamic = "force-dynamic";

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers":
      "Range,Accept,Accept-Language,Content-Type,Origin",
    "Access-Control-Expose-Headers":
      "Content-Length,Content-Range,Accept-Ranges,Content-Type,Cache-Control,ETag,Last-Modified,Content-Disposition",
    "Cross-Origin-Resource-Policy": "cross-origin",
    Vary: "Origin, Range, Accept, Accept-Language",
  };
}

// אפשר לקנפג ברשימת דומיינים מותרת דרך ENV (מופרד בפסיקים)
const ALLOWED = new Set(
  (process.env.PROXY_ALLOWED_HOSTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

function isAllowedHost(u: URL) {
  // אם לא הוגדר כלום – נאפשר הכל (אפשר להחמיר בהמשך)
  if (ALLOWED.size === 0) return true;
  return ALLOWED.has(u.hostname);
}

function bad(msg: string, code = 400, origin?: string) {
  return new NextResponse(JSON.stringify({ ok: false, error: msg }), {
    status: code,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
      "Cache-Control": "no-store",
    },
  });
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? undefined;
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// תמיכה ב-HEAD (חוסך דאטה לבדיקה מהקליינט/בדיקות curl -I)
export async function HEAD(req: NextRequest) {
  return handleProxy(req, /*isHead*/ true);
}

export async function GET(req: NextRequest) {
  return handleProxy(req, /*isHead*/ false);
}

async function handleProxy(req: NextRequest, isHead: boolean) {
  const origin = req.headers.get("origin") ?? undefined;

  try {
    const url = new URL(req.url);
    // "u" = URL מלא; "ub64" = אותו דבר base64 (לשמות מוזרים/תווים)
    const u = url.searchParams.get("u");
    const ub64 = url.searchParams.get("ub64");
    const force206 = url.searchParams.get("force206") === "1"; // אופציונלי

    const targetStr = ub64 ? Buffer.from(ub64, "base64").toString("utf8") : u;
    if (!targetStr) return bad("missing u|ub64", 400, origin);

    let target: URL;
    try {
      target = new URL(targetStr);
    } catch {
      return bad("invalid url", 400, origin);
    }

    if (!/^https?:$/.test(target.protocol))
      return bad("unsupported protocol", 400, origin);
    if (!isAllowedHost(target)) return bad("host not allowed", 403, origin);

    // נעביר כותרות רלוונטיות בלבד
    const inH = req.headers;
    const fwd: Record<string, string> = {};

    const range = inH.get("range") || undefined;
    if (range) fwd["range"] = range;
    else if (force206) fwd["range"] = "bytes=0-"; // רק אם ביקשת – לא נכפה כברירת מחדל

    fwd["user-agent"] =
      inH.get("user-agent") ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";
    fwd["accept"] =
      inH.get("accept") || "audio/*;q=0.9,video/*;q=0.8,*/*;q=0.7";
    const al = inH.get("accept-language");
    if (al) fwd["accept-language"] = al;
    // לעתים CDN בודק Referer:
    fwd["referer"] = `${target.origin}/`;

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 30_000); // 30s timeout סביר למדיה

    const upstream = await fetch(target.toString(), {
      method: isHead ? "HEAD" : "GET",
      headers: fwd,
      redirect: "follow",
      cache: "no-store",
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timeout));

    // נבנה כותרות ללקוח
    const h = new Headers();

    // נעביר כותרות חיוניות למדיה/קאשינג
    for (const key of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
      "etag",
      "last-modified",
      "content-disposition",
    ]) {
      const v = upstream.headers.get(key);
      if (v) h.set(key, v);
    }

    // אם המקור לא מציין – נשלים
    if (!h.has("Accept-Ranges")) h.set("Accept-Ranges", "bytes");

    // אם אין cache-control – ננטרל קאשינג בפרוקסי/דפדפן
    if (!h.has("Cache-Control")) h.set("Cache-Control", "no-store");

    // CORS
    const ch = corsHeaders(origin);
    for (const [k, v] of Object.entries(ch)) h.set(k, v);

    // אם זו בקשת HEAD, לא מחזירים גוף
    if (isHead) {
      return new NextResponse(null, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: h,
      });
    }

    const body = upstream.body;
    if (!body) return bad("no upstream body", 502, origin);

    // מחזירים את סטטוס המקור (200/206/416 וכו') – קריטי ל-seek
    return new NextResponse(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: h,
    });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : String(e);
    // אם זו AbortError – נחזיר 504
    const isAbort = /AbortError/i.test(msg);
    return bad(
      isAbort ? "upstream timeout" : msg || "proxy_error",
      isAbort ? 504 : 500,
      origin
    );
  }
}
