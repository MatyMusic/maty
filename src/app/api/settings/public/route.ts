// src/app/api/settings/public/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAppSettings } from "@/lib/admin-settings";

function j(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

export async function GET() {
  try {
    const s = await getAppSettings();
    // מחזירים רק שדות ציבוריים שנחוצים ל־Upgrade Page
    return j({
      ok: true,
      brand: { orgName: s.brand.orgName },
      billing: {
        enabled: s.billing.enabled,
        provider: s.billing.provider,
        minPlanFor: s.billing.minPlanFor, // { date_profile, date_matches, date_chat, farbrengen_join, club_post_create }
        upgradeCopy: s.billing.upgradeCopy || "",
      },
      consent: {
        version: s.consent.version,
        requireForDate: s.consent.requireForDate,
      },
    });
  } catch (e) {
    console.error("[GET /api/settings/public] error:", e);
    return j({ ok: false, error: "server_error" }, { status: 500 });
  }
}
