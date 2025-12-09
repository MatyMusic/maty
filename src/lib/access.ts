// src/lib/access.ts
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import { getAppSettings } from "./admin-settings";
import { getMembership, isMembershipActive, planGte } from "./billing";

export type AccessArea =
  | "date_profile"
  | "date_matches"
  | "date_chat"
  | "farbrengen_join"
  | "club_post_create";

export async function requireAccess(area: AccessArea) {
  const session = await getServerSession(authConfig);
  const settings = await getAppSettings();

  // consent/auth גורליים לאיזורי date/farbrengen
  if (area.startsWith("date") || area === "farbrengen_join") {
    // consent
    if (settings.consent.requireForDate) {
      // ההיגיון בפועל: דף/רואט שמזמן requireAccess יחליט מה לעשות אם חסר עוגייה
      // כאן רק נציין שהוא “נדרש”.
    }
    // auth
    if (settings.auth.requireForDate && !session?.user) {
      return { ok: false, code: 401 as const, reason: "auth_required" };
    }
  }

  // Billing
  if (settings.billing.enabled) {
    const need =
      settings.billing.minPlanFor[area] ??
      ("free" as (typeof settings.billing.minPlanFor)[keyof typeof settings.billing.minPlanFor]);

    // free? אין צורך לבדוק
    if (need !== "free") {
      if (!session?.user) {
        return { ok: false, code: 401 as const, reason: "auth_required" };
      }
      const userId = (session.user as any).id || session.user.email!;
      const m = await getMembership(userId);
      if (!isMembershipActive(m) || !planGte(m.plan, need)) {
        return {
          ok: false,
          code: 402 as const,
          reason: "payment_required",
          need,
        };
      }
    }
  }

  return { ok: true as const };
}
