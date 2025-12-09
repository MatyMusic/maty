export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";

const j = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });

function deepDecode(s: string) {
  try {
    const once = decodeURIComponent(s);
    return once.includes("%") ? decodeURIComponent(once) : once;
  } catch {
    return s;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = deepDecode(params.userId);
    const body = (await req.json().catch(() => ({}))) as Partial<{
      about_me: string;
      goals: "serious" | "marriage" | "friendship" | null;
      languages: string[];
      judaism_direction:
        | "orthodox"
        | "haredi"
        | "chasidic"
        | "chassidic"
        | "modern"
        | "conservative"
        | "reform"
        | "reconstructionist"
        | "secular"
        | null;
      kashrut_level: "strict" | "partial" | "none" | null;
      shabbat_level: "strict" | "partial" | "none" | null;
      tzniut_level: "strict" | "partial" | "none" | null;
    }>;

    const update: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (typeof body.about_me === "string") {
      update.about_me = String(body.about_me).slice(0, 4000);
    }
    if (body.goals === null || typeof body.goals === "string") {
      update.goals = body.goals;
    }
    if (Array.isArray(body.languages)) {
      update.languages = body.languages
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 50);
    }
    if (
      body.judaism_direction === null ||
      typeof body.judaism_direction === "string"
    ) {
      update.judaism_direction = body.judaism_direction;
    }
    if (body.kashrut_level === null || typeof body.kashrut_level === "string") {
      update.kashrut_level = body.kashrut_level;
    }
    if (body.shabbat_level === null || typeof body.shabbat_level === "string") {
      update.shabbat_level = body.shabbat_level;
    }
    if (body.tzniut_level === null || typeof body.tzniut_level === "string") {
      // יש אצלך לפעמים tzniut_level/ tzniut_level – נטפל בשניהם קדימה
      update.tzniut_level = body.tzniut_level;
      update.tzniut_level = body.tzniut_level;
    }

    const col = await getCollection("date_profiles");
    const res = await col.updateOne({ userId }, { $set: update });

    if (!res.matchedCount) {
      return j({ ok: false, error: "not_found" }, { status: 404 });
    }

    return j({ ok: true });
  } catch (e) {
    console.error("[POST profile update] error:", e);
    return j({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
