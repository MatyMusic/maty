// src/components/groups/GroupCard.tsx
"use client";
import * as React from "react";
import Link from "next/link";

export type GroupVM = {
  _id: string;
  title: string;
  description?: string | null;
  region?: { country?: string | null; city?: string | null } | null;
  coverUrl?: string | null;
  membersCount?: number;
};

export default function GroupCard({ g, href }: { g: GroupVM; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl shadow-sm hover:shadow-md border bg-white/60 dark:bg-slate-900/60 overflow-hidden"
    >
      <div className="aspect-[16/9] bg-neutral-200 dark:bg-neutral-800">
        {g.coverUrl ? (
          // אפשר להחליף ל-next/image לאחר הוספת domains
          <img
            src={g.coverUrl}
            alt={g.title}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      <div className="p-4">
        <div className="font-semibold text-lg">{g.title}</div>
        {g.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {g.description}
          </p>
        ) : null}
        <div className="text-xs mt-2 opacity-70">
          {g.region?.city || ""}{" "}
          {g.region?.country ? `• ${g.region.country}` : ""}
          {g.membersCount ? ` • ${g.membersCount} חברים` : ""}
        </div>
      </div>
    </Link>
  );
}
