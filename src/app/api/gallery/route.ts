// src/app/api/gallery/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getCollection } from "@/lib/mongo";
import type { Filter } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

type MediaKind = "image" | "video" | "audio";

type MediaDoc = {
  _id?: any;
  kind: MediaKind | string;
  title?: string;
  publicId: string;
  url: string;
  thumbUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  likes?: number;
  commentsCount?: number;
};

/**
 * בונה פילטר לפי פרמטרים:
 *  - אם יש ?tag= נחפש לפי תגית
 *  - אם אין tag בכלל → לא נסנן לפי תגיות (נחזיר הכל)
 *  - kind אופציונלי
 */
function buildFilter(params: URLSearchParams): Filter<MediaDoc> {
  const kind = (params.get("kind") || "").trim() as MediaKind | "";
  const tagRaw = params.get("tag"); // שים לב: לא ברירת-מחדל "gallery"

  const f: Filter<MediaDoc> = {};
  if (kind) {
    (f as any).kind = kind;
  }

  // רק אם באמת נשלח tag ב-query נסנן לפי תגיות
  if (tagRaw && tagRaw.trim()) {
    const tag = tagRaw.trim();
    // Mongo יודע למצוא איבר במערך לפי שוויון פשוט
    (f as any).tags = tag;
  }

  return f;
}

// זיהוי אודיו לפי פורמט / סיומת URL – גם אם kind בבסיס נתונים שגוי
function isAudioLike(doc: MediaDoc): boolean {
  const fmt = String(doc.format || "").toLowerCase();
  if (["mp3", "wav", "m4a", "ogg", "aac"].includes(fmt)) return true;

  try {
    const clean = doc.url.split("?")[0];
    const ext = clean.split(".").pop()?.toLowerCase();
    if (!ext) return false;
    if (["mp3", "wav", "m4a", "ogg", "aac"].includes(ext)) return true;
  } catch {
    // ignore
  }
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filter = buildFilter(params);

    const col = await getCollection<MediaDoc>("media");

    const docs = await col
      .find(filter, {
        projection: {
          kind: 1,
          title: 1,
          publicId: 1,
          url: 1,
          thumbUrl: 1,
          createdAt: 1,
          updatedAt: 1,
          tags: 1,
          likes: 1,
          commentsCount: 1,
          format: 1,
        },
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(300)
      .toArray();

    const items = docs.map((d) => {
      // קביעת kind יציב
      let kind: MediaKind;
      if (isAudioLike(d)) {
        kind = "audio";
      } else if (d.kind === "video") {
        kind = "video";
      } else if (d.kind === "audio") {
        kind = "audio";
      } else {
        kind = "image";
      }

      return {
        id:
          (d._id && typeof (d._id as any).toString === "function"
            ? (d._id as any).toString()
            : undefined) ||
          d.publicId ||
          d.url,
        publicId: d.publicId,
        kind,
        title: d.title || "",
        url: d.url,
        thumbUrl: d.thumbUrl || d.url,
        createdAt: (d.createdAt || d.updatedAt || new Date()).toISOString(),
        tags: d.tags || [],
        likes: typeof d.likes === "number" ? d.likes : 0,
        comments: typeof d.commentsCount === "number" ? d.commentsCount : 0,
        format: d.format || "",
      };
    });

    return NextResponse.json(
      { ok: true, items },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("GET /api/gallery error", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
