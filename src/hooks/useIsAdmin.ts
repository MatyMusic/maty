// src/hooks/useIsAdmin.ts
"use client";
import * as React from "react";

export function useIsAdmin() {
  const [state, setState] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/admin/me", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const j = await r.json().catch(() => ({}));
        if (!alive) return;
        setState(Boolean(j?.admin));
      } catch {
        if (alive) setState(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state; // true / false / null
}
