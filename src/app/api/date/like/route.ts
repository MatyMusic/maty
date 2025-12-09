import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { setLike, unsetLike, hasLike, isMatch } from "@/lib/db/date-like";
import { DATE_CONF } from "@/lib/date-config";
import { rateCheck, rlKeyFromReq } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* Helpers */
function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

/* POST /api/date/like  — like/unlike */
export async function POST(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user) return j({ error: "unauthorized" }, { status: 401 });

  const me = (s.user as any).id || s.user.email!;
  const ip = req.headers.get("x-forwarded-for") || req.ip || "";
  const okRL = await rateCheck(
    rlKeyFromReq({ path: "/api/date/like", userId: me, ip }),
    DATE_CONF.RATE_LIMIT.WINDOW_SEC,
    DATE_CONF.RATE_LIMIT.MAX_REQ
  );
  if (!okRL) return j({ error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const to = (body?.to as string | undefined)?.trim();
  const action = (body?.action as "like" | "unlike" | undefined) || "like";

  if (!to || to === me) return j({ error: "invalid_to" }, { status: 400 });

  if (action === "like") await setLike(me, to);
  else await unsetLike(me, to);

  const likedByMe = await hasLike(me, to);
  const likedMe = await hasLike(to, me);
  const match = likedByMe && likedMe;

  // חדש: החזרת matchId אם יש הדדיות (ייווצר אם לא קיים)
  let matchId: string | undefined = undefined;
  if (match) {
    const m = await isMatch(me, to);
    if (m.match) matchId = m.matchId;
  }

  return j({ ok: true, likedByMe, likedMe, match, matchId });
}

/* GET /api/date/like?userId=OTHER — סטטוס לייק/מאץ' */
export async function GET(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user) return j({ error: "unauthorized" }, { status: 401 });

  const me = (s.user as any).id || s.user.email!;
  const url = new URL(req.url);
  const other = url.searchParams.get("userId")?.trim();
  if (!other) return j({ error: "userId_required" }, { status: 400 });

  const likedByMe = await hasLike(me, other);
  const likedMe = await hasLike(other, me);
  const match = likedByMe && likedMe;

  // חדש: אם כבר יש הדדיות, נחזיר גם matchId
  let matchId: string | undefined = undefined;
  if (match) {
    const m = await isMatch(me, other);
    if (m.match) matchId = m.matchId;
  }

  return j({
    ok: true,
    likedByMe,
    likedMe,
    match,
    matchId,
    requireMutual: DATE_CONF.CHAT_REQUIRE_MUTUAL_LIKE,
  });
}
