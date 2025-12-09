// src/app/api/admin/settings/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import authConfig from "@/auth-config";
import {
  getAppSettings,
  saveAppSettings,
  type AppSettings,
} from "@/lib/admin-settings";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

function isAdmin(role?: string | null) {
  return role === "admin" || role === "superadmin";
}

export async function GET() {
  const s = await getServerSession(authConfig);
  const role = (s as any)?.user?.role || null;

  if (!s?.user || !isAdmin(role)) {
    return j({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const settings = await getAppSettings();
  return j({ ok: true, settings });
}

export async function PUT(req: NextRequest) {
  const s = await getServerSession(authConfig);
  const role = (s as any)?.user?.role || null;

  if (!s?.user || !isAdmin(role)) {
    return j({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Partial<AppSettings> | null = null;
  try {
    body = (await req.json()) as Partial<AppSettings>;
  } catch {
    return j({ ok: false, error: "bad_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return j({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const saved = await saveAppSettings(body);
  return j({ ok: true, settings: saved });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: "GET,PUT,OPTIONS", "Cache-Control": "no-store" },
  });
}
