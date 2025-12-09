// // src/app/api/audio/health/route.ts
// import { NextRequest } from "next/server";

// export async function GET(req: NextRequest) {
//   const u = req.nextUrl.searchParams.get("u");
//   if (!u) return new Response("Missing ?u", { status: 400 });
//   const url = new URL(u);

//   const result: any = { url: url.toString() };

//   try {
//     // 1) HEAD כדי לבדוק Content-Type/Length
//     const headRes = await fetch(url, { method: "HEAD", redirect: "follow" });
//     result.headStatus = headRes.status;
//     result.contentType = headRes.headers.get("content-type");
//     result.contentLength = headRes.headers.get("content-length");
//     result.acceptRanges = headRes.headers.get("accept-ranges");

//     // 2) בקשת טווח קטנה (byte 0)
//     const rangeRes = await fetch(url, {
//       method: "GET",
//       headers: { Range: "bytes=0-0", "Accept-Encoding": "identity" },
//       redirect: "follow",
//     });

//     result.rangeStatus = rangeRes.status; // מצופה 206
//     result.rangeAcceptRanges = rangeRes.headers.get("accept-ranges");
//     result.rangeContentRange = rangeRes.headers.get("content-range");

//     // קביעה סופית
//     result.playable =
//       (result.rangeStatus === 206 || result.acceptRanges === "bytes") &&
//       (result.contentType?.startsWith("audio/") ||
//         /audio|mpeg|mp3|aac|ogg/.test(result.contentType || ""));

//     return Response.json(result);
//   } catch (e: any) {
//     return Response.json(
//       { ...result, error: e?.message || String(e) },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/audio/health/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) return new Response("Missing ?u", { status: 400 });
  const url = new URL(u);

  const result: any = { url: url.toString() };

  try {
    // 1) HEAD כדי לבדוק Content-Type/Length
    const headRes = await fetch(url, { method: "HEAD", redirect: "follow" });
    result.headStatus = headRes.status;
    result.contentType = headRes.headers.get("content-type");
    result.contentLength = headRes.headers.get("content-length");

    // 2) בדיקת Range / Accept-Ranges
    const rangeRes = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1023" },
      redirect: "follow",
    });
    result.rangeStatus = rangeRes.status;
    result.acceptRanges = rangeRes.headers.get("accept-ranges");

    // קביעה סופית
    result.playable =
      (result.rangeStatus === 206 || result.acceptRanges === "bytes") &&
      (result.contentType?.startsWith("audio/") ||
        /audio|mpeg|mp3|aac|ogg/.test(result.contentType || ""));

    return Response.json(result);
  } catch (e: any) {
    return Response.json(
      { ...result, error: e?.message || String(e) },
      { status: 500 },
    );
  }
}
