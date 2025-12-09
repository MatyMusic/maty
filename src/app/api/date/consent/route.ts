// // src/app/api/date/consent/route.ts
// import { NextResponse } from "next/server";
// // אפשר בהמשך להחליף לשליפה אמיתית מה-DB לפי משתמש
// export async function GET() {
//   return NextResponse.json({ ok: true, consent: false, source: "default" });
// }
// export async function POST(req: Request) {
//   const { consent } = await req.json().catch(() => ({ consent: false }));
//   // כאן שמור ב-DB/kv וכו'
//   return NextResponse.json({ ok: true, consent: !!consent, saved: true });
// }

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getCol(name: string) {
  try {
    const mod = await import("@/lib/db/mongo");
    if (typeof (mod as any).getCollection === "function") {
      return await (mod as any).getCollection(name);
    }
  } catch {}
  try {
    const { default: connectDB } = await import("@/lib/db/mongoose");
    await connectDB();
    const mongoose = (await import("mongoose")).default;
    return mongoose.connection.collection(name);
  } catch (e) {
    throw new Error("DB unavailable: " + (e as any)?.message);
  }
}

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const mm = cookieStore.get("mm_uid");
    const userId = mm?.value;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const consents = await getCol("date_consents");
    const row = await consents.findOne({ userId });

    return NextResponse.json({
      ok: true,
      consented: !!(row?.consented ?? false),
      at: row?.updatedAt ?? row?.createdAt ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 },
    );
  }
}
