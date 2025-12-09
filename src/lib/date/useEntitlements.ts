import * as React from "react";

export type EntState = {
  loading: boolean;
  error?: string | null;
  tier?: "free" | "plus" | "pro" | "vip";
  status?: "active" | "inactive";
  avatarUrl?: string | null;
  userId?: string;
  name?: string;
  policy?: Record<string, boolean>;
};

export function useEntitlements() {
  const [s, setS] = React.useState<EntState>({ loading: true });

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/date/entitlements", { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;
        if (!j?.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setS({
          loading: false,
          tier: j.tier,
          status: j.status,
          avatarUrl: j.avatarUrl,
          userId: j.userId,
          name: j.name,
          policy: j.policy || {},
        });
      } catch (e: any) {
        if (!alive) return;
        setS({ loading: false, error: e?.message || "failed" });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function can(feature: "chat" | "video" | "wink" | "superlike") {
    return !!s.policy?.[feature];
  }

  return { ...s, can };
}
