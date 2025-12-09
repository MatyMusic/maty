// דף מלא
"use client";
import * as React from "react";

export function usePromos(locale: string) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    fetch(`/api/promos?locale=${encodeURIComponent(locale)}`, {
      cache: "no-store",
      headers: { "x-app-locale": locale },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!alive) return;
        setItems(j.items || []);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(String(e?.message || e));
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [locale]);

  return { items, loading, err };
}
