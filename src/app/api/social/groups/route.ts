// import { NextRequest, NextResponse } from "next/server";
// import type { GroupLite } from "@/types/social";

// const INMEM_GROUPS: GroupLite[] = [
//   {
//     id: "g1",
//     name: "רצים פארק הירקון",
//     city: "ת״א",
//     sport: "ריצה",
//     membersCount: 128,
//     adminId: "admin1",
//     approved: true,
//   },
// ];

// export async function GET() {
//   return NextResponse.json({ ok: true, items: INMEM_GROUPS });
// }

// export async function POST(req: NextRequest) {
//   const body = await req.json().catch(() => ({}));
//   const name = (body?.name || "").trim();
//   const city = (body?.city || "").trim();
//   const sport = (body?.sport || "").trim();
//   if (!name)
//     return NextResponse.json({ ok: false, error: "שם חובה" }, { status: 400 });
//   const g: GroupLite = {
//     id: "g" + Math.random().toString(36).slice(2, 8),
//     name,
//     city,
//     sport,
//     membersCount: 1,
//     adminId: "me",
//     approved: false,
//   };
//   INMEM_GROUPS.push(g);
//   return NextResponse.json({ ok: true, item: g });
// }

import { NextResponse } from "next/server";
import { getSessionSafe } from "@/lib/authz"; // אם אין – תחליף למימוש לוקאלי כמו אצלך
import {
  createGroupRequest,
  listGroupsPublic,
  type SportHeb,
} from "@/lib/db/groups-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** המרה למסמך קל ל-UI */
function toLite(g: any) {
  return {
    id: String(g._id),
    name: g.title,
    city: g.city ?? null,
    sport: Array.isArray(g.sports) && g.sports[0] ? g.sports[0] : null,
    approved: g.status === "approved",
    membersCount: g.membersCount ?? 0,
  };
}

/** GET /api/social/groups */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const sport = (searchParams.get("sport") || undefined) as
    | SportHeb
    | undefined;
  const city = searchParams.get("city") || undefined;
  const limit = Number(searchParams.get("limit") || "20");
  const page = Number(searchParams.get("page") || "1");

  const { items, total, pages } = await listGroupsPublic({
    q,
    sport,
    city: city || null,
    limit,
    page,
  });

  return NextResponse.json({
    ok: true,
    items: items.map(toLite),
    total,
    pages,
  });
}

/** POST /api/social/groups — תואם לשדות מה-UI: {name, city, sport} */
export async function POST(req: Request) {
  try {
    const session = await getSessionSafe().catch(() => null);
    const userId =
      (session as any)?.user?.id || (session as any)?.user?.userId || null;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}) as any);
    const name = (body?.name || "").toString().trim();
    const city = (body?.city || "").toString().trim() || null;
    const sport = (body?.sport || "").toString().trim();

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "missing_name" },
        { status: 400 },
      );
    }

    // מיפוי לשכבת ה-DB
    const group = await createGroupRequest(userId, {
      title: name,
      description: "",
      sports: sport ? [sport as SportHeb] : [],
      visibility: "public",
      city,
    });

    return NextResponse.json({ ok: true, group: toLite(group) });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 },
    );
  }
}
