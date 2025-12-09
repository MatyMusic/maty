// src/app/api/club/live/stop/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import connectDB from "@/lib/db/mongoose";
import LiveSession from "@/models/club/LiveSession";
import { NextRequest, NextResponse } from "next/server";

/* ───────── Session helpers ───────── */

async function readSession() {
  try {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

function uid(user: any): string | null {
  if (!user) return null;
  const id = (user as any).id || (user as any)._id || (user as any).sub;
  return id ? String(id) : null;
}

function isSuperAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = String(process.env.SUPERADMINS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers || {}),
    },
  });
}

/**
 * POST /api/club/live/stop
 *
 * Body אופציונלי:
 *  - targetUserId: רק לאדמין / סופראדמין – לעצור מישהו אחר.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await readSession();
    const meId = uid(session?.user);
    const meEmail = (session?.user as any)?.email as string | undefined;

    if (!meId) {
      return j({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const isSuper =
      (session?.user as any)?.role === "superadmin" ||
      (session?.user as any)?.role === "admin" ||
      isSuperAdminEmail(meEmail);

    let targetUserId: string | null = null;

    const body =
      (await req.json().catch(async () => {
        try {
          const form = await req.formData();
          const o: any = {};
          for (const [k, v] of form.entries()) {
            if (typeof v === "string") o[k] = v;
          }
          return o;
        } catch {
          return {};
        }
      })) || {};

    if (typeof body.targetUserId === "string" && body.targetUserId.trim()) {
      targetUserId = body.targetUserId.trim();
    }

    // אם ביקשו לעצור מישהו אחר – רק לאדמין / סופראדמין מותר
    const userIdToStop = targetUserId && isSuper ? targetUserId : meId;

    const now = new Date();

    const res = await LiveSession.findOneAndUpdate(
      { userId: userIdToStop },
      {
        $set: {
          active: false,
          camOn: false,
          lastPingAt: now,
        },
      },
      { new: true },
    ).lean();

    if (!res) {
      return j({ ok: true, item: null, message: "no_session" });
    }

    return j({ ok: true, item: res });
  } catch (e: any) {
    console.error("[LIVE.STOP.POST] error:", e);
    return j(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "production" ? "server_error" : e?.message,
      },
      { status: 500 },
    );
  }
}
