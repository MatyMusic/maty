"use client";
import { useEffect, useState } from "react";

export default function IdentityForm() {
  const [form, setForm] = useState<any>({
    jewishByMother: false,
    conversion: false,
    judaismDirection: "orthodox",
    kashrut: "strict",
    shabbat: "strict",
    prayer: "daily",
    tzniut: "strict",
    torahReading: "daily",
    communityParticipation: "active",
    giurSupport: false,
    knowledgeLevel: "basic",
    holidays: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/date/identity")
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) setForm((f: any) => ({ ...f, ...d }));
      })
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/date/identity", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.jewishByMother}
            onChange={(e) =>
              setForm({ ...form, jewishByMother: e.target.checked })
            }
          />
          יהדות מהאם
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.conversion}
            onChange={(e) => setForm({ ...form, conversion: e.target.checked })}
          />
          גיור
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.giurSupport}
            onChange={(e) =>
              setForm({ ...form, giurSupport: e.target.checked })
            }
          />
          מוכנ/ה לתמוך בגיור
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <label className="flex flex-col">
          זרם ביהדות
          <select
            className="border rounded px-3 h-10"
            value={form.judaismDirection}
            onChange={(e) =>
              setForm({ ...form, judaismDirection: e.target.value })
            }
          >
            <option value="orthodox">אורתודוקסי</option>
            <option value="haredi">חרדי</option>
            <option value="chassidic">חסידי</option>
            <option value="modern_orthodox">מודרני</option>
            <option value="conservative">קונסרבטיבי</option>
            <option value="reform">רפורמי</option>
            <option value="reconstructionist">רקונסטרוקטיבי</option>
            <option value="cultural">חילוני/תרבותי</option>
          </select>
        </label>
        <label className="flex flex-col">
          כשרות
          <select
            className="border rounded px-3 h-10"
            value={form.kashrut}
            onChange={(e) => setForm({ ...form, kashrut: e.target.value })}
          >
            <option value="strict">קפדנית</option>
            <option value="partial">חלקית</option>
            <option value="none">לא שומר</option>
          </select>
        </label>
        <label className="flex flex-col">
          שבת
          <select
            className="border rounded px-3 h-10"
            value={form.shabbat}
            onChange={(e) => setForm({ ...form, shabbat: e.target.value })}
          >
            <option value="strict">קפדנית</option>
            <option value="partial">חלקית</option>
            <option value="none">לא שומר</option>
          </select>
        </label>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <label className="flex flex-col">
          תפילה
          <select
            className="border rounded px-3 h-10"
            value={form.prayer}
            onChange={(e) => setForm({ ...form, prayer: e.target.value })}
          >
            <option value="daily">יומית</option>
            <option value="sometimes">לפעמים</option>
            <option value="never">לעולם לא</option>
          </select>
        </label>
        <label className="flex flex-col">
          צניעות
          <select
            className="border rounded px-3 h-10"
            value={form.tzniut}
            onChange={(e) => setForm({ ...form, tzniut: e.target.value })}
          >
            <option value="strict">קפדנית</option>
            <option value="partial">חלקית</option>
            <option value="none">לא שומר/ת</option>
          </select>
        </label>
        <label className="flex flex-col">
          קריאת תורה
          <select
            className="border rounded px-3 h-10"
            value={form.torahReading}
            onChange={(e) => setForm({ ...form, torahReading: e.target.value })}
          >
            <option value="daily">באופן קבוע</option>
            <option value="sometimes">לעיתים</option>
            <option value="never">לא קורא</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col">
        חגים אהובים (הקלד פסיקים)
        <input
          className="border rounded px-3 h-10"
          value={(form.holidays || []).join(", ")}
          onChange={(e) =>
            setForm({ ...form, holidays: e.target.value.split(/,\\s*/) })
          }
        />
      </label>

      <button
        disabled={saving}
        className="inline-flex h-10 items-center rounded-2xl px-5 border shadow-sm"
      >
        {saving ? "שומר..." : "שמור"}
      </button>
    </form>
  );
}
