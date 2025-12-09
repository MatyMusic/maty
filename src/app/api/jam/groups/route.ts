// src/app/api/jam/groups/route.ts

import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  createSlugFromTitle,
  getJamCollections,
  normalizeId,
} from "@/lib/jam/db";
import type { JamGroup } from "@/lib/jam/types";

/**
 * GET /api/jam/groups
 */
export async function GET(req: Request) {
  try {
    const { groups } = await getJamCollections(); // שים לב: בלי "main"

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const city = url.searchParams.get("city")?.trim();
    const genre = url.searchParams.get("genre")?.trim();
    const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);
    const cursor = url.searchParams.get("cursor");

    const filter: any = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
    }

    if (city) {
      filter.city = { $regex: `^${city}$`, $options: "i" };
    }

    if (genre) {
      filter.genres = { $regex: genre, $options: "i" };
    }

    if (cursor) {
      try {
        filter._id = { $gt: new ObjectId(cursor) };
      } catch {
        // נתעלם מ-cursor לא תקין
      }
    }

    const docs = await groups
      .find(filter)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .toArray();

    let nextCursor: string | null = null;
    if (docs.length > limit) {
      const last = docs.pop();
      if (last?._id) {
        nextCursor = String(last._id);
      }
    }

    const items = docs.map((d) => normalizeId<JamGroup & { _id: any }>(d));

    return NextResponse.json({
      ok: true,
      items,
      nextCursor,
    });
  } catch (err) {
    console.error("[JAM.GROUPS.GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: "שגיאה בטעינת קבוצות JAM" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/jam/groups
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "UNAUTHORIZED",
          message: "חובה להתחבר כדי לפתוח קבוצת JAM",
        },
        { status: 401 },
      );
    }

    const userId = String(session.user.id);
    const payload = (await req.json()) as Partial<JamGroup>;
    const title = (payload.title || "").toString().trim();

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "BAD_REQUEST", message: "חייבים לתת שם לקבוצה" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const slugBase = createSlugFromTitle(title);

    const { groups } = await getJamCollections();

    let slug = slugBase;
    let i = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await groups.findOne({ slug });
      if (!exists) break;
      slug = `${slugBase}-${i++}`;
    }

    const doc: JamGroup = {
      title,
      slug,
      description: (payload.description || "").toString().trim() || undefined,
      city: payload.city?.toString().trim() || undefined,
      country: payload.country?.toString().trim() || "IL",

      genres:
        payload.genres && Array.isArray(payload.genres) ? payload.genres : [],
      daws: payload.daws && Array.isArray(payload.daws) ? payload.daws : [],
      purposes:
        payload.purposes && Array.isArray(payload.purposes)
          ? payload.purposes
          : [],
      skillsWanted:
        payload.skillsWanted && Array.isArray(payload.skillsWanted)
          ? payload.skillsWanted
          : [],

      ownerId: userId,
      adminIds: [userId],
      memberCount: 1,
      isOpen: payload.isOpen ?? true,
      visibility: payload.visibility || "public",

      tags: payload.tags && Array.isArray(payload.tags) ? payload.tags : [],

      createdAt: now,
      updatedAt: now,
    };

    const insertRes = await groups.insertOne(doc as any);
    const inserted = await groups.findOne({ _id: insertRes.insertedId });

    return NextResponse.json({
      ok: true,
      item: inserted ? normalizeId(inserted) : null,
    });
  } catch (err) {
    console.error("[JAM.GROUPS.POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", message: "שגיאה ביצירת קבוצת JAM" },
      { status: 500 },
    );
  }
}
