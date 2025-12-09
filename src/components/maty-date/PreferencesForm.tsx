"use client";

import * as React from "react";
import AgeRange from "@/maty/ui/AgeRange";
import Button from "@/maty/ui/button";
import { showToast } from "@/maty/ui/Toaster";

export default function PreferencesForm() {
  const [minAge, setMinAge] = React.useState(20);
  const [maxAge, setMaxAge] = React.useState(40);
  const [allowSmoker, setAllowSmoker] = React.useState(false);
  const [okWithKids, setOkWithKids] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      // שומרים כשדות פרופיל כלליים (לא חובה – תוכל להעביר ל־collection נפרדת)
      const r = await fetch("/api/date/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // נשמרים לצרכי חיפוש עתידי:
          // אפשר לשמור תחת שדות custom כמו "pref_min_age" וכו'
          pref_min_age: minAge,
          pref_max_age: maxAge,
          pref_allow_smoker: allowSmoker,
          pref_ok_with_kids: okWithKids,
        }),
      });
      if (!r.ok) throw new Error("שמירה נכשלה");
      showToast("העדפות נשמרו ✓", "success");
    } catch (e: any) {
      showToast(e?.message || "שגיאה בשמירה", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-6"
    >
      <h2 className="text-xl font-extrabold mb-4">העדפות התאמה</h2>

      <div className="space-y-4">
        <div>
          <div className="mb-1 text-sm opacity-80">טווח גיל</div>
          <AgeRange
            min={18}
            max={99}
            step={1}
            valueMin={minAge}
            valueMax={maxAge}
            onChange={({ min, max }) => {
              setMinAge(min);
              setMaxAge(max);
            }}
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allowSmoker}
            onChange={(e) => setAllowSmoker(e.target.checked)}
          />
          <span className="text-sm">אפשר למעשנ/ת</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={okWithKids}
            onChange={(e) => setOkWithKids(e.target.checked)}
          />
          <span className="text-sm">מתאים/ה לזוגיות עם ילדים</span>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-2">
        <div className="text-xs opacity-70">
          {minAge}–{maxAge} · טווח גיל נוכחי
        </div>
        <div className="flex gap-2">
          <a href="/date/edit" className="inline-flex">
            <Button variant="outline">הקודם</Button>
          </a>
          <Button onClick={save} disabled={saving}>
            {saving ? "שומר…" : "שמור"}
          </Button>
          <a href="/date/matches" className="inline-flex">
            <Button variant="ghost">הבא · התאמות</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
