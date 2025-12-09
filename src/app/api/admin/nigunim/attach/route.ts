import { NextRequest, NextResponse } from "next/server";
import nigunClientPromise from "@/lib/mongo-nigunim";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function slugify(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0590-\u05FF]/g, (m) => m) // השאר עברית
    .trim()
    .toLowerCase()
    .replace(/[\s\p{S}\p{P}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = (body.title || "").toString().trim();
    const slug = (body.slug || "").toString().trim() || slugify(title);
    const audioUrl = (body.audioUrl || "").toString().trim();
    const duration = Number(body.duration || 0) || null;
    const cover = (body.cover || "").toString().trim() || null;

    if (!audioUrl) {
      return NextResponse.json(
        { ok: false, error: "missing_audioUrl" },
        { status: 400 }
      );
    }
    if (!slug && !title) {
      return NextResponse.json(
        { ok: false, error: "missing_title_or_slug" },
        { status: 400 }
      );
    }

    // (אופציונלי) לוודא שזה לינק לקלאודינרי
    try {
      const u = new URL(audioUrl);
      if (!u.hostname.includes("res.cloudinary.com")) {
        return NextResponse.json(
          { ok: false, error: "invalid_cloudinary_url" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid_url" },
        { status: 400 }
      );
    }

    const client = await nigunClientPromise;
    const db = client.db(process.env.MONGODB_DB_NIGUNIM || "maty-nigunim");
    const col = db.collection("nigunim");

    const now = new Date();
    const res = await col.updateOne(
      { slug },
      {
        $set: {
          title: title || slug,
          audioUrl,
          duration,
          cover,
          source: "nigunim",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    return NextResponse.json({
      ok: true,
      slug,
      upserted: !!res.upsertedId,
      modified: res.modifiedCount,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "attach_failed" },
      { status: 500 }
    );
  }
}
