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
    const cookieStore = await cookies(); // 👈 Next 15
    const mm = cookieStore.get("mm_uid");
    const userId = mm?.value;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const profiles = await getCol("date_profiles");
    const consents = await getCol("date_consents");

    const prof =
      (await profiles.findOne({ userId })) ||
      (await profiles.findOne({ _id: userId }));

    const consent = await consents.findOne({ userId });

    return NextResponse.json({
      ok: true,
      profileId: prof ? String(prof.userId ?? prof._id) : null,
      hasProfile: !!prof,
      optedIn: !!(consent?.consented ?? false),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 },
    );
  }
}
