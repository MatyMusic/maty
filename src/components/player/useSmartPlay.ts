// src/app/api/proxy-audio/route.ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("u");
    if (!raw) return new Response("Missing ?u", { status: 400 });
    const url = new URL(raw);

    // אופציונלי: allowlist לפי host
    // const allowed = ["res.cloudinary.com", "cdn.maty-music.com"];
    // if (!allowed.some(h => url.hostname.endsWith(h))) return new Response("Host not allowed", { status: 403 });

    const range = req.headers.get("range") ?? undefined;

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        ...(range ? { Range: range } : {}),
        Accept: "*/*",
        "Accept-Encoding": "identity",
        "User-Agent": "MatyMusicProxy/1.0",
      },
      redirect: "follow",
    });

    const status = upstream.status;
    const body = upstream.body;
    if (!body) return new Response("No body", { status: 502 });

    const h = new Headers(upstream.headers);
    if (!h.get("Content-Type")) h.set("Content-Type", "audio/mpeg");
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Accept-Ranges", h.get("Accept-Ranges") || "bytes");
    h.delete("Content-Security-Policy");
    h.delete("X-Frame-Options");

    return new Response(body, { status, headers: h });
  } catch (e: any) {
    console.error("[proxy-audio] error:", e?.message || e);
    return new Response("Proxy error", { status: 502 });
  }
}
