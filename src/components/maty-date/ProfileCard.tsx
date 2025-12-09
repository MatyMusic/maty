"use client";
import { useEffect, useState } from "react";
import PhotoUploader from "./PhotoUploader";

export default function ProfileCard() {
  const [form, setForm] = useState<any>({
    displayName: "",
    jewishName: "",
    birthYear: 1995,
    gender: "male",
    city: "",
    country: "",
    languages: ["he"],
    photos: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/date/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) setForm((f: any) => ({ ...f, ...d }));
      })
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/date/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
  }

  function addPhoto(url: string) {
    setForm((f: any) => ({ ...f, photos: [...(f.photos || []), url] }));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
      <label className="flex flex-col">
        שם לתצוגה
        <input
          className="border rounded px-3 h-10"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
        />
      </label>
      <label className="flex flex-col">
        שם יהודי (אם קיים)
        <input
          className="border rounded px-3 h-10"
          value={form.jewishName || ""}
          onChange={(e) => setForm({ ...form, jewishName: e.target.value })}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col">
          שנת לידה
          <input
            type="number"
            className="border rounded px-3 h-10"
            value={form.birthYear}
            onChange={(e) => setForm({ ...form, birthYear: +e.target.value })}
          />
        </label>
        <label className="flex flex-col">
          מין
          <select
            className="border rounded px-3 h-10"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="male">זכר</option>
            <option value="female">נקבה</option>
            <option value="other">אחר</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col">
          מדינה
          <input
            className="border rounded px-3 h-10"
            value={form.country || ""}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </label>
        <label className="flex flex-col">
          עיר
          <input
            className="border rounded px-3 h-10"
            value={form.city || ""}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <PhotoUploader onAdd={addPhoto} />
        <div className="flex gap-2 overflow-x-auto">
          {(form.photos || []).map((u: string, i: number) => (
            <img
              key={i}
              src={u}
              className="w-14 h-14 rounded object-cover border"
            />
          ))}
        </div>
      </div>
      <label className="flex flex-col">
        על עצמי
        <textarea
          className="border rounded p-3"
          rows={4}
          value={form.bio || ""}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
      </label>
      <div>
        <button
          disabled={saving}
          className="inline-flex h-10 items-center rounded-2xl px-5 border shadow-sm"
        >
          {saving ? "שומר..." : "שמור"}
        </button>
      </div>
    </form>
  );
}
