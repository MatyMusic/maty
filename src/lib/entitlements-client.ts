// קליינט: בדיקה האם אדמין-bypass או שיש הרשאה לפי ה-ENTITLEMENTS בצד הלקוח

import { ENTITLEMENTS } from "@/lib/date/entitlements";

export async function isBypassActiveClient(): Promise<boolean> {
  try {
    const r = await fetch("/api/admin/bypass", { cache: "no-store" });
    const j = await r.json();
    return !!j?.active;
  } catch {
    return false;
  }
}

/**
 * gateAction:
 *  - אם אדמין-bypass → מרשה
 *  - אחרת בודק ENTITLEMENTS.canUse(feature, tier, status)
 *  - אם חסום → קורא onBlocked (למשל לפתוח מודאל מחירון)
 */
export async function gateAction(
  feature: "chat" | "video" | "superlike",
  myTier: "free" | "plus" | "pro" | "vip",
  myStatus: "active" | "inactive",
  onAllowed: () => void,
  onBlocked: () => void,
) {
  const bypass = await isBypassActiveClient();
  if (bypass) return onAllowed();
  const ok = ENTITLEMENTS.canUse(feature, myTier, myStatus);
  if (ok) onAllowed();
  else onBlocked();
}
