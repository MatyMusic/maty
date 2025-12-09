// src/lib/date/entitlements.ts
export type Feature =
  | "like"
  | "wink"
  | "superlike"
  | "chat"
  | "video"
  | "read_receipts";

type Tier = "free" | "plus" | "pro" | "vip";
type Status = "active" | "inactive";

const MATRIX: Record<Feature, (tier: Tier, status: Status) => boolean> = {
  like: () => true, // תמיד
  wink: (t, s) =>
    s === "active" && (t === "plus" || t === "pro" || t === "vip"),
  superlike: (t, s) => s === "active" && t === "vip",
  chat: (t, s) => s === "active" && (t === "pro" || t === "vip"),
  video: (t, s) => s === "active" && (t === "pro" || t === "vip"),
  read_receipts: (t, s) => s === "active" && t === "vip",
};

export const ENTITLEMENTS = {
  canUse(feature: Feature, tier: Tier, status: Status) {
    return !!MATRIX[feature]?.(tier, status);
  },
  listFor(tier: Tier) {
    const active: Status = "active";
    return (Object.keys(MATRIX) as Feature[]).filter((f) =>
      MATRIX[f](tier, active)
    );
  },
};
