import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

function toCSV(rows: any[]) {
  if (!rows.length) return "email,name,role,createdAt,updatedAt\n";
  const headers = ["email", "name", "role", "createdAt", "updatedAt"];
  const esc = (v: any) => {
    const s = (v ?? "").toString();
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows
    .map((r) =>
      headers
        .map((h) =>
          esc(
            h === "createdAt" || h === "updatedAt"
              ? r[h]
                ? new Date(r[h]).toISOString()
                : ""
              : r[h]
          )
        )
        .join(",")
    )
    .join("\n");
  return headers.join(",") + "\n" + body + "\n";
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const db = await getDb();
  const rows = await db
    .collection("users")
    .find(
      {},
      {
        projection: {
          _id: 0,
          email: 1,
          name: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .toArray();

  const csv = toCSV(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
