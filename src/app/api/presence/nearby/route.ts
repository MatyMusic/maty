export const runtime = "edge";

import { NextRequest } from "next/server";

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...(init || {}),
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init?.headers || {}),
    },
  });
}

const SAMPLE = [
  {
    id: "u_1",
    nickname: "Shai",
    displayName: "Shai Levi",
    avatarUrl: "/assets/images/avatar-mizrahi.png",
    distance_m: 1200,
    here: true,
  },
  {
    id: "u_2",
    nickname: "Miri",
    displayName: "Miriam K.",
    avatarUrl: "/assets/images/avatar-soft.png",
    distance_m: 4300,
    here: false,
  },
  {
    id: "u_3",
    nickname: "Avi",
    displayName: "Avi Cohen",
    avatarUrl: "/assets/images/avatar-chabad.png",
    distance_m: 800,
    here: true,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(
    1,
    Math.min(20, Number(searchParams.get("limit")) || 8),
  );

  // כאן בעתיד: לקרוא מה־DB/Redis לפי מיקום/חדר/דף
  const users = SAMPLE.slice(0, limit);
  const online = 42; // דוגמה
  const here = users.filter((u) => u.here).length;

  return json({ ok: true, users, online, here });
}
