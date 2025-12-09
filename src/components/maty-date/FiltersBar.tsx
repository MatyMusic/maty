"use client";
import { useState } from "react";

export default function FiltersBar({
  onRun,
}: {
  onRun: (filters: any) => void;
}) {
  const [filters, setFilters] = useState<any>({});

  return (
    <div className="flex flex-wrap items-end gap-3 border rounded-xl p-3">
      <div className="flex flex-col">
        <label className="text-sm">עיר</label>
        <input
          className="border rounded px-3 h-10"
          placeholder="למשל: ירושלים"
          onChange={(e) =>
            setFilters({
              ...filters,
              cities: e.target.value ? [e.target.value] : [],
            })
          }
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm">גיל מינ׳</label>
        <input
          type="number"
          className="border rounded px-3 h-10"
          onChange={(e) => setFilters({ ...filters, ageMin: +e.target.value })}
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm">גיל מקס׳</label>
        <input
          type="number"
          className="border rounded px-3 h-10"
          onChange={(e) => setFilters({ ...filters, ageMax: +e.target.value })}
        />
      </div>
      <button
        onClick={() => onRun(filters)}
        className="inline-flex h-10 items-center rounded-2xl px-5 border shadow-sm"
      >
        חפש
      </button>
    </div>
  );
}
