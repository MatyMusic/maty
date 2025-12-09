// src/app/api/admin/groups/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin-only";
import { NextResponse } from "next/server";

type AdminGroup = {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  source: "club" | "jam" | "fit" | "date";
  createdAt: string;
};

// דמו בזיכרון – אפשר להחליף במונגו בהמשך
const INMEM: AdminGroup[] = [];

/** GET – רשימת קבוצות לבקרה באדמין */
export async function GET() {
  await requireAdmin(); // זורק שגיאה אם לא אדמין
  return NextResponse.json(
    {
      ok: true,
      items: INMEM,
    },
    { status: 200 },
  );
}

/** PATCH – עדכון סטטוס קבוצה */
export async function PATCH(req: Request) {
  await requireAdmin();

  const body = (await req.json().catch(() => null)) as {
    id?: string;
    action?: "approve" | "reject" | "pending";
  } | null;

  if (!body?.id || !body?.action) {
    return NextResponse.json(
      { ok: false, error: "id/action חסרים" },
      { status: 400 },
    );
  }

  const idx = INMEM.findIndex((g) => g.id === body.id);
  if (idx === -1) {
    return NextResponse.json({ ok: false, error: "לא נמצא" }, { status: 404 });
  }

  const statusMap: Record<string, AdminGroup["status"]> = {
    approve: "approved",
    reject: "rejected",
    pending: "pending",
  };

  INMEM[idx] = {
    ...INMEM[idx],
    status: statusMap[body.action] ?? INMEM[idx].status,
  };

  return NextResponse.json({ ok: true, item: INMEM[idx] }, { status: 200 });
}
