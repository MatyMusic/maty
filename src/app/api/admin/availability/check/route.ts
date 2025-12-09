// src/app/api/availability/check/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongo";

function ymd(d: any) {
  const s = String(d || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

// יחזיר free | hold | busy
function summarize(rows: any[]) {
  const now = new Date();
  const live = rows.filter((r) => !r.expiresAt || new Date(r.expiresAt) > now);
  if (live.some((r) => r.status === "busy")) return { status: "busy" as const };
  const hold = live.find((r) => r.status === "hold");
  if (hold)
    return {
      status: "hold" as const,
      holdUntil: hold.expiresAt || null,
      note: hold.note || null,
    };
  return { status: "free" as const };
}

// GET ?date=YYYY-MM-DD  ||  ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const date = ymd(url.searchParams.get("date"));
  const from = ymd(url.searchParams.get("from"));
  const to = ymd(url.searchParams.get("to"));

  const col = await getCollection("availability");
  if (date) {
    const rows = await col.find({ date }).toArray();
    const res = summarize(rows);
    return NextResponse.json({ ok: true, date, ...res });
  }

  if (from && to) {
    const rows = await col
      .find({ date: { $gte: from, $lte: to } })
      .sort({ date: 1 })
      .toArray();

    // קיבוץ לפי תאריך
    const map = new Map<string, any[]>();
    rows.forEach((r) => {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    });

    const days: string[] = [];
    let cur = new Date(from);
    const end = new Date(to);
    while (cur <= end) {
      const s = cur.toISOString().slice(0, 10);
      days.push(s);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const result = days.map((d) => ({
      date: d,
      ...summarize(map.get(d) || []),
    }));
    return NextResponse.json({ ok: true, days: result });
  }

  return NextResponse.json(
    { ok: false, error: "missing_params" },
    { status: 400 }
  );
}
