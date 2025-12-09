// // src/app/api/date/upload/route.ts
// import { NextResponse } from "next/server";
// import { randomBytes } from "crypto";
// import { promises as fs } from "fs";
// import path from "path";

// export const runtime = "nodejs";

// export async function POST(req: Request) {
//   try {
//     const form = await req.formData();
//     const file = form.get("file");
//     if (!(file instanceof File)) {
//       return NextResponse.json({ error: "file is required" }, { status: 400 });
//     }
//     if (!file.type.startsWith("image/")) {
//       return NextResponse.json(
//         { error: "only image/* is allowed" },
//         { status: 400 }
//       );
//     }

//     const buf = Buffer.from(await file.arrayBuffer());
//     const uploadDir = path.join(process.cwd(), "public", "uploads");
//     await fs.mkdir(uploadDir, { recursive: true });

//     const ext = path.extname(file.name || "").toLowerCase() || ".jpg";
//     const name = `${Date.now()}_${randomBytes(6).toString("hex")}${ext}`;
//     await fs.writeFile(path.join(uploadDir, name), buf);

//     return NextResponse.json({ url: `/uploads/${name}` });
//   } catch (e) {
//     console.error(e);
//     return NextResponse.json({ error: "upload failed" }, { status: 500 });
//   }
// }

// src/app/api/date/upload/route.ts
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return j({ ok: false, error: "file_required" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return j({ ok: false, error: "unsupported_type" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return j({ ok: false, error: "too_large" }, { status: 413 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const extByMime =
      file.type === "image/jpeg"
        ? ".jpg"
        : file.type === "image/png"
        ? ".png"
        : file.type === "image/webp"
        ? ".webp"
        : file.type === "image/gif"
        ? ".gif"
        : path.extname(file.name || "").toLowerCase() || ".jpg";

    const name = `${Date.now()}_${randomBytes(6).toString("hex")}${extByMime}`;
    await fs.writeFile(path.join(uploadDir, name), buf);

    return j({ ok: true, url: `/uploads/${name}` });
  } catch (e) {
    console.error("[POST /api/date/upload] error:", e);
    return j({ ok: false, error: "upload_failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST,OPTIONS,HEAD",
      "Access-Control-Allow-Methods": "POST,OPTIONS,HEAD",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "no-store",
    },
  });
}
export async function HEAD() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
