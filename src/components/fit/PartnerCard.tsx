"use client";
import * as React from "react";

type Props = {
  displayName: string | null;
  userId: string;
  avatarUrl: string | null;
  sports: string[];
  level: string | null;
  gym: string | null;
  distKm: number | null;
  available: boolean;
};

export default function PartnerCard(p: Props) {
  return (
    <article className="rounded-2xl border p-4 hover:shadow transition">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.avatarUrl || "/assets/images/avatars/default.png"}
          alt={p.displayName || p.userId}
          className="w-16 h-16 rounded-full object-cover"
          loading="lazy"
        />
        <div className="flex-1 rtl">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{p.displayName || p.userId}</h3>
            {p.available && (
              <span className="text-xs px-2 py-0.5 rounded-full border">
                זמין/ה
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            {p.sports?.length ? p.sports.join(" · ") : "ספורט: לא צוין"}
            {p.level ? ` · רמה: ${p.level}` : ""}
          </div>
          <div className="text-sm mt-0.5">
            {p.gym ? `אזור/מכון: ${p.gym}` : "אזור: —"}
            {p.distKm != null ? ` · ${p.distKm.toFixed(1)} ק״מ ממך` : ""}
          </div>
        </div>
      </div>
    </article>
  );
}
