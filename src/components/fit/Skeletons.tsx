// src/components/fit/Skeletons.tsx
"use client";
import * as React from "react";

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="rounded-2xl border p-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-28 h-28 rounded-xl bg-black/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-black/10 rounded w-2/3" />
              <div className="h-3 bg-black/10 rounded w-5/6" />
              <div className="h-3 bg-black/10 rounded w-4/6" />
              <div className="flex gap-2 mt-3">
                <div className="h-6 w-16 bg-black/10 rounded" />
                <div className="h-6 w-16 bg-black/10 rounded" />
                <div className="h-6 w-16 bg-black/10 rounded" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
