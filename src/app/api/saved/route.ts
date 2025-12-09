// src/app/api/saved/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { auth } from "@/lib/auth"; // יש לך כבר lib/auth

export const dynamic = "force-dynamic";

type SavedItem = {
  _id?: any;
  userEmail: string;
  itemId: string; // לדוגמה: "nig_<mongo_id>" או "local_<mongo_id>"
  source: "nigunim" | "local" | "youtube" | "spotify";
  title: string;
  artists?: string[];
  cover?: string;
  url?: string;
  link?: string;
  createdAt: Date;
};

async function requireUserEmail() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("unauthorized");
  return email;
}

export async function GET(req: NextRequest) {
  try {
    const email = await requireUserEmail();
    const col = await getCollection<SavedItem>("saved_tracks");
    const url = new URL(req.url);
    const limit = Math.max(
      1,
      Math.min(100, Number(url.searchParams.get("limit") ?? 48))
    );
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const items = await col
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    const status = e?.message === "unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = await requireUserEmail();
    const body = await req.json();

    const item: SavedItem = {
      userEmail: email,
      itemId: String(body.itemId),
      source: body.source,
      title: String(body.title || "Untitled"),
      artists: Array.isArray(body.artists) ? body.artists : [],
      cover: body.cover || undefined,
      url: body.url || undefined,
      link: body.link || undefined,
      createdAt: new Date(),
    };

    const col = await getCollection<SavedItem>("saved_tracks");
    await col.createIndex({ userEmail: 1, itemId: 1 }, { unique: true });

    await col.updateOne(
      { userEmail: email, itemId: item.itemId },
      { $setOnInsert: item },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status =
      e?.code === 11000 ? 200 : e?.message === "unauthorized" ? 401 : 500;
    return NextResponse.json(
      { ok: status === 200, error: e?.message },
      { status }
    );
  }
}
