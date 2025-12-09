// src/app/(date)/date/search/page.tsx
"use client";
import { useState } from "react";
import FiltersBar from "@/components/maty-date/FiltersBar";

export default function Page() {
  const [rows, setRows] = useState<any[]>([]);

  async function run(filters: any) {
    const r = await fetch("/api/date/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    const j = await r.json();
    setRows(j || []);
  }

  return (
    <div className="grid gap-6" dir="rtl">
      <h1 className="text-3xl font-extrabold">חיפוש</h1>
      <FiltersBar onRun={run} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rows.map((p: any, i: number) => (
          <div key={i} className="border rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={p.photos?.[0] || "/icon-192.png"}
                className="w-12 h-12 rounded object-cover border"
                alt=""
              />
              <div>
                <div className="font-bold">{p.displayName}</div>
                <div className="text-sm text-muted-foreground">
                  {p.city || ""}
                </div>
              </div>
            </div>
            <button className="w-full inline-flex h-9 items-center rounded-2xl px-4 border">
              לייק
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
