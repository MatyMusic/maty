// src/app/api/date/prefs/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import {
  getPreferences,
  upsertPreferences,
  type DatePreferencesDoc,
} from "@/lib/db/date-repo";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id)
      return j({ ok: false, error: "unauthorized" }, { status: 401 });

    const prefs = await getPreferences(String(session.user.id));
    return j({ ok: true, prefs: prefs || null });
  } catch (e) {
    console.error("[GET /api/date/prefs] error:", e);
    return j({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id)
      return j({ ok: false, error: "unauthorized" }, { status: 401 });

    const body = (await req
      .json()
      .catch(() => ({}))) as Partial<DatePreferencesDoc>;
    const saved = await upsertPreferences({
      ...(body || {}),
      userId: String(session.user.id),
    });
    return j({ ok: true, prefs: saved });
  } catch (e) {
    console.error("[POST /api/date/prefs] error:", e);
    return j({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET,POST,PUT,OPTIONS,HEAD",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS,HEAD",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "no-store",
    },
  });
}
export async function HEAD() {
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
