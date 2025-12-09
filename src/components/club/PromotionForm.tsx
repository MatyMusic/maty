// src/components/club/PromotionForm.tsx
"use client";

import * as React from "react";

type Values = {
  title: string;
  body?: string;
  imageUrl?: string;
  ctaText?: string;
  link?: string;
  couponCode?: string;
  placement:
    | "feed_top"
    | "feed_middle"
    | "feed_bottom"
    | "sidebar"
    | "interstitial";
  weight: number;
  active: boolean;
  startsAt?: string | null; // yyyy-mm-ddThh:mm
  endsAt?: string | null;
};

export default function PromotionForm({
  initial,
  onSaved,
}: {
  initial?: Partial<Values>;
  onSaved?: (item: any) => void;
}) {
  const [v, setV] = React.useState<Values>({
    title: initial?.title || "",
    body: initial?.body || "",
    imageUrl: initial?.imageUrl || "",
    ctaText: initial?.ctaText || "",
    link: initial?.link || "",
    couponCode: initial?.couponCode || "",
    placement: (initial?.placement as any) || "feed_top",
    weight: Number(initial?.weight ?? 1),
    active: !!initial?.active,
    startsAt: initial?.startsAt || "",
    endsAt: initial?.endsAt || "",
  });
  const [loading, setLoading] = React.useState(false);
  const canSave = v.title.trim().length >= 2;

  async function save() {
    if (!canSave) return;
    setLoading(true);
    try {
      const r = await fetch("/api/club/promotions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...v,
          startsAt: v.startsAt || null,
          endsAt: v.endsAt || null,
        }),
      });
      const j = await r.json();
      if (j?.ok) onSaved?.(j.item);
      else alert(j?.error || "שגיאה בשמירה");
    } catch (e: any) {
      alert(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  const field = "grid grid-cols-[120px_1fr] items-center gap-2";

  return (
    <div className="space-y-3" dir="rtl">
      <div className={field}>
        <label className="text-sm opacity-70">כותרת *</label>
        <input
          className="input"
          value={v.title}
          onChange={(e) => setV({ ...v, title: e.target.value })}
          placeholder="כיתוב קצר ובולט"
          maxLength={140}
          required
        />
      </div>

      <div className={field}>
        <label className="text-sm opacity-70">תיאור</label>
        <textarea
          className="textarea min-h-24"
          value={v.body}
          onChange={(e) => setV({ ...v, body: e.target.value })}
          placeholder="שורת תיאור/הטבה"
          maxLength={1000}
        />
      </div>

      <div className={field}>
        <label className="text-sm opacity-70">תמונה</label>
        <input
          className="input"
          value={v.imageUrl}
          onChange={(e) => setV({ ...v, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className={field}>
        <label className="text-sm opacity-70">CTA / כפתור</label>
        <input
          className="input"
          value={v.ctaText}
          onChange={(e) => setV({ ...v, ctaText: e.target.value })}
          placeholder="לרכישה / לפרטים"
          maxLength={60}
        />
      </div>

      <div className={field}>
        <label className="text-sm opacity-70">קישור</label>
        <input
          className="input"
          value={v.link}
          onChange={(e) => setV({ ...v, link: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div className={field}>
        <label className="text-sm opacity-70">קופון</label>
        <input
          className="input"
          value={v.couponCode}
          onChange={(e) => setV({ ...v, couponCode: e.target.value })}
          placeholder="MATY30"
          maxLength={60}
        />
      </div>

      <div className={field}>
        <label className="text-sm opacity-70">מיקום</label>
        <select
          className="select"
          value={v.placement}
          onChange={(e) => setV({ ...v, placement: e.target.value as any })}
        >
          <option value="feed_top">ראש הפיד</option>
          <option value="feed_middle">אמצע הפיד</option>
          <option value="feed_bottom">סוף הפיד</option>
          <option value="sidebar">סיידבר</option>
          <option value="interstitial">מסך ביניים</option>
        </select>
      </div>

      <div className={field}>
        <label className="text-sm opacity-70">משקל</label>
        <input
          type="number"
          className="input"
          value={v.weight}
          min={1}
          max={99}
          onChange={(e) => setV({ ...v, weight: Number(e.target.value || 1) })}
        />
      </div>

      <div className={field}>
        <label className="text-sm opacity-70">פעיל</label>
        <input
          type="checkbox"
          checked={v.active}
          onChange={(e) => setV({ ...v, active: e.target.checked })}
          className="h-4 w-4"
        />
      </div>

      <div className={field}>
        <label className="text-sm opacity-70">החל מתאריך</label>
        <input
          type="datetime-local"
          className="input"
          value={v.startsAt || ""}
          onChange={(e) => setV({ ...v, startsAt: e.target.value })}
        />
      </div>

      <div className={field}>
        <label className="text-sm opacity-70">עד תאריך</label>
        <input
          type="datetime-local"
          className="input"
          value={v.endsAt || ""}
          onChange={(e) => setV({ ...v, endsAt: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          disabled={!canSave || loading}
          onClick={save}
          className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "שומר..." : "שמור פרסום"}
        </button>
      </div>
    </div>
  );
}
