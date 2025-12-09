import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { DATE_CONF } from "@/lib/date-config";
import { rateCheck, rlKeyFromReq } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const ip = req.headers.get("x-forwarded-for") || req.ip || "";
  const okRL = await rateCheck(
    rlKeyFromReq({ path: "/api/date/search", ip }),
    DATE_CONF.RATE_LIMIT.WINDOW_SEC,
    DATE_CONF.RATE_LIMIT.MAX_REQ
  );
  if (!okRL)
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const q: any = {};
  const city = url.searchParams.get("city");
  const country = url.searchParams.get("country");
  const gender = url.searchParams.get("gender");
  const dir = url.searchParams.get("direction");
  const kashrut = url.searchParams.get("kashrut");
  const shabbat = url.searchParams.get("shabbat");

  if (city) q.city = city;
  if (country) q.country = country;
  if (gender) q.gender = gender;
  if (dir) q.judaism_direction = dir;
  if (kashrut) q.kashrut_level = kashrut;
  if (shabbat) q.shabbat_level = shabbat;

  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    DATE_CONF.SEARCH.MAX_PAGE_SIZE,
    parseInt(
      url.searchParams.get("size") || `${DATE_CONF.SEARCH.PAGE_SIZE}`,
      10
    )
  );
  const skip = (page - 1) * pageSize;

  const db = (await clientPromise).db(process.env.MONGODB_DB || "maty-music");
  const P = db.collection("date_profiles");
  const [items, total] = await Promise.all([
    P.find(q)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .project({ password: 0, email: 0 })
      .toArray(),
    P.countDocuments(q),
  ]);

  return NextResponse.json({ ok: true, total, page, size: pageSize, items });
}
