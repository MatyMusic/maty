// src/app/api/music/top/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCollection } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session as any)?.user?.id || (session as any)?.user?.userId;
  if (!userId)
    return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.max(
    1,
    Math.min(5, Number(url.searchParams.get("limit") || 3))
  );

  const settings = await (
    await getCollection<any>("settings")
  ).findOne({ userId });
  if (!settings?.shareMusicToDate) {
    return NextResponse.json({ ok: true, tracks: [] }); // אין שיתוף? מחזיר ריק
  }

  const saved = await getCollection<any>("saved_tracks");
  const items = await saved
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const tracks = items.map((it: any) => ({
    title: it.title,
    artists: it.artists || [],
    cover: it.cover,
    url: it.url || it.link,
  }));

  return NextResponse.json({ ok: true, tracks });
}
