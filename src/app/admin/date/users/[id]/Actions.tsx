"use client";

import * as React from "react";

export default function Actions({ id, initial }: { id: string; initial: any }) {
  const [busy, start] = React.useTransition();
  const [state, setState] = React.useState<{
    status?: string;
    paused?: boolean;
    verifiedAt?: string | null;
  }>({
    status: initial.status,
    paused: !!initial.paused,
    verifiedAt: initial.verifiedAt || null,
  });
  const go = (action: "verify" | "pause" | "unpause" | "block") => {
    start(async () => {
      const r = await fetch(`/api/admin/date/profile/${id}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await r.json().catch(() => null);
      if (j?.ok) setState(j.state);
      else alert(j?.error || "שגיאה");
    });
  };
  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={busy}
        onClick={() => go("verify")}
        className="h-9 rounded-full px-3 text-sm border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-900/20"
      >
        אשר פרופיל
      </button>
      {state.paused ? (
        <button
          disabled={busy}
          onClick={() => go("unpause")}
          className="h-9 rounded-full px-3 text-sm border border-amber-500/40 bg-amber-50/70 dark:bg-amber-900/20"
        >
          בטל השהיה
        </button>
      ) : (
        <button
          disabled={busy}
          onClick={() => go("pause")}
          className="h-9 rounded-full px-3 text-sm border border-amber-500/40 bg-amber-50/70 dark:bg-amber-900/20"
        >
          השהה
        </button>
      )}
      <button
        disabled={busy}
        onClick={() => go("block")}
        className="h-9 rounded-full px-3 text-sm border border-red-500/40 bg-red-50/70 dark:bg-red-900/20"
      >
        חסום
      </button>
    </div>
  );
}
