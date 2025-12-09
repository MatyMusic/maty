export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";

const j = (d: unknown, i?: ResponseInit) =>
  NextResponse.json(d, {
    ...i,
    headers: { "Cache-Control": "no-store", ...(i?.headers || {}) },
  });

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    const email = session?.user?.email;
    if (!email) return j({ ok: false, error: "unauthorized" }, { status: 401 });

    // users: שולף אווטאר ושם
    const usersCol = await getCollection("users");
    const u = await usersCol.findOne(
      { email },
      { projection: { avatarUrl: 1, name: 1, _id: 1 } }
    );

    // memberships/subscription: איפה שאתה שומר מצב מינוי (כאן דוגמה בתוך users)
    const tier = (u as any)?.subscription?.tier ?? "free";
    const status = (u as any)?.subscription?.status ?? "inactive";

    return j({
      ok: true,
      tier,
      status,
      userId: String(u?._id || ""),
      name: u?.name || "",
      avatarUrl: u?.avatarUrl || null,
      // policy לבקרה בצד לקוח/שרת
      policy: {
        chat: tier === "pro" || tier === "vip",
        video: tier === "pro" || tier === "vip",
        wink: tier !== "free" && status === "active",
        superlike: tier === "vip" && status === "active",
      },
    });
  } catch (e) {
    console.error("[entitlements] error:", e);
    return j({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
