import { NextRequest, NextResponse } from "next/server";
import Customer from "@/models/Customer";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

function toCSV(rows: any[]) {
  const headers = [
    "email",
    "name",
    "phone",
    "tags",
    "source",
    "lastSeenAt",
    "lastOrderAt",
    "createdAt",
    "updatedAt",
  ];
  const esc = (v: any) => {
    const s = v == null ? "" : Array.isArray(v) ? v.join("|") : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows
    .map((r) =>
      headers
        .map((h) => {
          const v =
            h.endsWith("At") && r[h] ? new Date(r[h]).toISOString() : r[h];
          return esc(v);
        })
        .join(",")
    )
    .join("\n");
  return headers.join(",") + "\n" + body + "\n";
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const rows = await Customer.find().sort({ createdAt: -1 }).lean();
  const csv = toCSV(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
