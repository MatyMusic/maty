// src/app/api/admin/settings/features/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import authConfig from "@/auth-config";
import { getPresenceFeature, setPresenceFeature } from "@/lib/db/features";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function j(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isAdmin(session: any) {
  const role = session?.user?.role;
  const email = session?.user?.email;
  return !!email && (role === "admin" || role === "superadmin");
}

// לקרוא את מצב ה־Presence (לא בהכרח חייב להיות מוגבל לאדמין,
// לכן השארתי GET פתוח כמו שהיה אצלך)
export async function GET() {
  const presence = await getPresenceFeature();
  return j({ ok: true, presence });
}

// עדכון מצב ה־Presence – רק אדמין
export async function PUT(req: Request) {
  const session = await getServerSession(authConfig);
  if (!isAdmin(session)) {
    return j({ ok: false, error: "unauthorized" }, 401);
  }

  let body: any = {};
  try {
    body = (await req.json().catch(() => ({}))) || {};
  } catch {
    body = {};
  }

  const presence = await setPresenceFeature(
    body?.presence ?? {},
    session?.user?.email ?? null,
  );

  return j({ ok: true, presence });
}
