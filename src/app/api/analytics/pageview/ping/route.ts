// src/app/api/analytics/ping/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

function dbName() {
  return process.env.MONGODB_DB || "maty-music";
}
function ipOf(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0]?.trim() || "0.0.0.0";
}
function uaOf(req: NextRequest) {
  return req.headers.get("user-agent") || "";
}
function sidOf(req: NextRequest) {
  const c = req.headers.get("cookie") || "";
  const m = c.match(/_sid=([^;]+)/);
  return m?.[1] || null;
}
const setSid = () => {
  const sid = Math.random().toString(36).slice(2);
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toUTCString();
  return `Set-Cookie: _sid=${sid}; Path=/; SameSite=Lax; Expires=${expires}`;
};

export async function POST(req: NextRequest) {
  const db = (await clientPromise).db(dbName());
  const body = await req.json().catch(() => ({}));
  const t = String(body?.t || "pageview"); // event type
  const p = String(body?.p || "/"); // page path
  const now = new Date();

  let sid = sidOf(req);
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (!sid) {
    const hdr = setSid();
    headers["set-cookie"] = hdr.replace("Set-Cookie: ", "");
    sid = hdr.match(/_sid=([^;]+)/)?.[1] || null;
  }

  const sessions = db.collection("analytics_sessions");
  const events = db.collection("analytics_events");

  // upsert session
  if (sid) {
    await sessions.updateOne(
      { sid },
      {
        $setOnInsert: {
          sid,
          ua: uaOf(req),
          ip: ipOf(req),
          createdAt: now,
        },
        $set: { lastAt: now },
      },
      { upsert: true },
    );
  }

  // insert event
  await events.insertOne({
    sid: sid || null,
    t,
    p,
    at: now,
  });

  return NextResponse.json({ ok: true }, { headers });
}
