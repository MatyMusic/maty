export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { nearbyUsers } from "@/lib/db/geo";
import { usersOnlineMap } from "@/lib/db/presence";
import clientPromise from "@/lib/mongodb";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const km = Number(searchParams.get("km") || "20");
  if (!isFinite(lat) || !isFinite(lng))
    return j({ ok: false, error: "bad_coords" }, { status: 400 });

  const near = await nearbyUsers(lng, lat, km);

  // להבאת פרטי משתמש (שם/אווטאר) — נניח שיש אוסף users או date_profiles
  const cli = await clientPromise;
  const db = cli.db(process.env.MONGODB_DB || "maty-music");

  // ננסה תחילה date_profiles, ואם אין – users
  const ids = near.map((x) => x.userId);
  const P = db.collection("date_profiles");
  const users = await P.find({ userId: { $in: ids } })
    .project({
      _id: 0,
      userId: 1,
      displayName: 1,
      avatarUrl: 1,
      city: 1,
      country: 1,
    })
    .toArray();

  const presence = await usersOnlineMap(ids);

  const items = near.map((n) => {
    const u = users.find((x: any) => x.userId === n.userId) || {
      displayName: "משתמש/ת",
      avatarUrl: null,
    };
    const pres = presence.get(n.userId);
    return {
      userId: n.userId,
      distMeters: n.dist,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      online: !!pres,
      device: pres?.device || null,
      city: u.city || null,
      country: u.country || null,
    };
  });

  return j({ ok: true, items });
}
