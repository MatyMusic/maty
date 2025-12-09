// // src/app/api/audio/route.ts
// import { NextRequest } from "next/server";

// const ALLOWED = (process.env.AUDIO_ALLOWLIST ?? "")
//   .split(",")
//   .map((s) => s.trim())
//   .filter(Boolean);

// // מומלץ: חתימה עם HMAC כדי שלא יהיה Open Proxy (אפשר להוסיף בהמשך)
// function isAllowed(url: URL) {
//   if (ALLOWED.length === 0) return true; // לפיתוח בלבד
//   return ALLOWED.some((host) => url.host.endsWith(host));
// }

// export async function GET(req: NextRequest) {
//   try {
//     const u = req.nextUrl.searchParams.get("u");
//     if (!u) return new Response("Missing ?u", { status: 400 });

//     const target = new URL(u);
//     if (!isAllowed(target))
//       return new Response("Host not allowed", { status: 403 });

//     // מעבירים את ה-Range מהדפדפן לשרת היעד
//     const range = req.headers.get("range") ?? undefined;

//     const upstream = await fetch(target.toString(), {
//       method: "GET",
//       headers: {
//         ...(range ? { Range: range } : {}),
//         // לפעמים נדרש כדי לקבל 206
//         "User-Agent": "MatyMusicProxy/1.0",
//         Accept: "*/*",
//         "Accept-Encoding": "identity", // שלא ידחסו לנו את האודיו
//       },
//       redirect: "follow",
//     });

//     // מעבירים הלאה את הסטטוס (200/206/416...)
//     const status = upstream.status;
//     const readable = upstream.body;
//     if (!readable) return new Response("No body", { status: 502 });

//     // כותרות חשובות לנגן
//     const h = new Headers(upstream.headers);
//     // להקפיד על Content-Type נכון (audio/mpeg, audio/aac, audio/ogg וכו')
//     if (!h.get("Content-Type")) h.set("Content-Type", "audio/mpeg");

//     // מאפשרים ניגון מהדפדפן שלנו
//     h.set("Access-Control-Allow-Origin", "*");
//     h.set("Accept-Ranges", h.get("Accept-Ranges") || "bytes");

//     // להסיר כותרות אסורות/מסוכנות
//     h.delete("Content-Security-Policy");
//     h.delete("X-Frame-Options");

//     return new Response(readable, { status, headers: h });
//   } catch (err: any) {
//     console.error("[/api/audio] error:", err?.message || err);
//     return new Response("Proxy error", { status: 502 });
//   }
// }

// src/app/api/audio/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = (process.env.AUDIO_ALLOWLIST ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// מומלץ: חתימה עם HMAC כדי שלא יהיה Open Proxy (אפשר להוסיף בהמשך)
function isAllowed(url: URL) {
  if (ALLOWED.length === 0) return true; // לפיתוח בלבד
  return ALLOWED.some((host) => url.host.endsWith(host));
}

export async function GET(req: NextRequest) {
  try {
    const u = req.nextUrl.searchParams.get("u");
    if (!u) return new Response("Missing ?u param", { status: 400 });

    const url = new URL(u);
    if (!isAllowed(url)) {
      return new Response("Host not allowed", { status: 403 });
    }

    // מעבירים כותרת Range אם יש – בשביל seek
    const headers: Record<string, string> = {};
    const range = req.headers.get("range");
    if (range) headers["range"] = range;

    const upstream = await fetch(url, {
      method: "GET",
      headers,
      redirect: "follow",
    });

    const status = upstream.status;
    const readable = upstream.body;
    const h = new Headers(upstream.headers);

    // מאפשרים ניגון מהדפדפן שלנו
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Accept-Ranges", h.get("Accept-Ranges") || "bytes");

    // להסיר כותרות אסורות/מסוכנות
    h.delete("Content-Security-Policy");
    h.delete("X-Frame-Options");

    return new Response(readable, { status, headers: h });
  } catch (err: any) {
    console.error("[/api/audio] error:", err?.message || err);
    return new Response("Proxy error", { status: 502 });
  }
}
