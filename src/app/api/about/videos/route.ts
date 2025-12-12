// src/app/api/about/videos/route.ts
import { insertVideoDemo, listPublishedVideos } from "@/lib/db/videoDemos";
import { NextRequest, NextResponse } from "next/server";

// אפשר בעתיד להוסיף בדיקת אדמין דרך next-auth
// כרגע ה־UI (useIsAdmin) מסתיר את הטופס, וה־API פתוח.

export async function GET(_req: NextRequest) {
  try {
    const items = await listPublishedVideos(24);

    return NextResponse.json(
      {
        items,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/about/videos] error:", err);
    return NextResponse.json(
      { error: "שגיאה בטעינת רשימת הווידאוים" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      title?: string;
      description?: string;
      thumbnailUrl?: string;
      videoUrl?: string;
      isPublished?: boolean;
    } | null;

    if (!body?.title || !body?.videoUrl) {
      return NextResponse.json(
        { error: "חובה לשלוח לפחות title ו-videoUrl" },
        { status: 400 },
      );
    }

    const item = await insertVideoDemo({
      title: body.title,
      description: body.description,
      thumbnailUrl: body.thumbnailUrl,
      videoUrl: body.videoUrl,
      isPublished: body.isPublished,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/about/videos] error:", err);
    return NextResponse.json(
      { error: "שגיאה בשמירת הווידאו" },
      { status: 500 },
    );
  }
}
