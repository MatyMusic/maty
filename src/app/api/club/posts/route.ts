// src/app/api/club/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  addPost,
  readPosts,
  genId,
  ensureStorage,
  saveUpload,
  type ClubPost,
  type PostStatus,
} from "@/lib/clubStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** =========================
 *  GET  /api/club/posts
 *  ========================= */
export async function GET(req: NextRequest) {
  await ensureStorage();
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "approved") as
    | PostStatus
    | "all";
  const authorId = searchParams.get("authorId");

  let items = await readPosts();

  if (authorId) items = items.filter((p) => p.authorId === authorId);
  if (status !== "all") items = items.filter((p) => p.status === status);

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return NextResponse.json({ ok: true, items });
}

/** =========================
 *  POST /api/club/posts
 *  ========================= */
export async function POST(req: NextRequest) {
  await ensureStorage();

  const contentType = req.headers.get("content-type") || "";
  let meta: any = null;
  let imageUrls: string[] = [];
  let audioUrl: string | null = null;

  // ---- Multipart (files) ----
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();

    const metaRaw = form.get("meta");
    if (typeof metaRaw !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing meta" },
        { status: 400 },
      );
    }
    try {
      meta = JSON.parse(metaRaw);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Bad meta JSON" },
        { status: 400 },
      );
    }

    const imageFiles = form
      .getAll("images")
      .filter((v) => v instanceof File) as File[];
    if (imageFiles.length) {
      imageUrls = await Promise.all(
        imageFiles.slice(0, 12).map((f) => saveUpload(f, "images")),
      );
    }
    const audioFile = form.get("audio");
    if (audioFile instanceof File) {
      audioUrl = await saveUpload(audioFile, "audio");
    }
  }
  // ---- Pure JSON ----
  else {
    try {
      meta = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400 },
      );
    }
  }

  // ---- Basic validation ----
  const mode = (meta?.mode as ClubPost["mode"]) || "post";
  if (mode === "poll") {
    const q = String(meta?.poll?.question || "").trim();
    const opts = Array.isArray(meta?.poll?.options)
      ? meta.poll.options
          .map((s: any) => String(s || "").trim())
          .filter(Boolean)
      : [];
    if (!q || opts.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Invalid poll (need question + 2 options)" },
        { status: 400 },
      );
    }
  }

  // ---- Author detection (cookie first, then header, then guest) ----
  const ckUid = req.cookies.get("mm_uid")?.value;
  const hdUid = req.headers.get("x-mm-uid") || undefined;
  const authorId = ckUid || hdUid || "guest";

  // ---- Build post ----
  const post: ClubPost = {
    id: genId(),
    createdAt: new Date().toISOString(),
    authorId,

    mode,
    text: String(meta?.text || ""),
    images: imageUrls.length ? imageUrls : [],
    videoUrl: meta?.videoUrl || null,
    audioUrl: audioUrl || null,

    hashtags: Array.isArray(meta?.hashtags) ? meta.hashtags.slice(0, 20) : [],
    scheduleISO: meta?.scheduleISO || null,
    audience: meta?.audience || "community",
    visibility: meta?.visibility || "visible",
    location: meta?.location || null,

    poll:
      mode === "poll"
        ? {
            question: meta.poll.question,
            options: meta.poll.options,
            multi: !!meta.poll.multi,
            durationHours: Number(meta.poll.durationHours || 24),
          }
        : null,

    status: "pending",
  };

  await addPost(post);

  return NextResponse.json({ ok: true, id: post.id });
}
