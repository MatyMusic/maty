import { NextResponse } from "next/server";
import User from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId, consent, purpose } = await req.json();
    if (!userId)
      return NextResponse.json(
        { ok: false, error: "missing_userId" },
        { status: 400 },
      );

    const update: any = {};
    if (typeof consent === "boolean") {
      update.consentTasteForMatching = consent;
      update.consentAt = consent ? new Date() : null;
    }
    if (purpose && ["music", "dating", "both"].includes(purpose)) {
      update.purpose = purpose;
    }

    await User.updateOne({ _id: userId }, { $set: update });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}
