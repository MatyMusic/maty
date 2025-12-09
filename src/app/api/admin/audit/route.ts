import { NextRequest, NextResponse } from "next/server";
import AuditEvent from "@/models/AuditEvent";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || undefined;
  const email = url.searchParams.get("email") || undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") || 200), 1000);

  const q: any = {};
  if (type) q.type = type;
  if (email) q.email = email.toLowerCase();

  const items = await AuditEvent.find(q)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return NextResponse.json({ ok: true, items });
}
