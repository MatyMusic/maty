"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

const DAWS = [
  "cubase",
  "ableton",
  "logic",
  "reaper",
  "studioone",
  "protools",
  "other",
] as const;
const PURPOSES = [
  "collab",
  "rehearsal",
  "learning",
  "mix_master",
  "gear_swap",
  "jam",
  "community",
] as const;

export default function NewGroupForm() {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [daws, setDaws] = React.useState<string[]>([]);
  const [purposes, setPurposes] = React.useState<string[]>(["collab"]);
  const [city, setCity] = React.useState("");
  const [meetingTime, setMeetingTime] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  function toggle(list: string[], v: string) {
    const s = new Set(list);
    s.has(v) ? s.delete(v) : s.add(v);
    return Array.from(s);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/music/groups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        purposes,
        daws,
        city: city || null,
        meetingTime: meetingTime || null,
      }),
    });
    const j = await res.json();
    setLoading(false);
    if (!j?.ok) {
      alert("שגיאה בפתיחת קבוצה");
      return;
    }
    alert("הבקשה נשלחה וממתינה לאישור אדמין");
    router.push("/music/groups?mine=1");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl rounded-2xl border p-4 bg-card space-y-3"
    >
      <div>
        <label className="block text-sm">שם הקבוצה</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-xl border"
        />
      </div>
      <div>
        <label className="block text-sm">תיאור</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-xl border"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">מטרות</label>
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPurposes((v) => toggle(v, p))}
              className={`px-2 py-1 rounded-full border text-xs ${purposes.includes(p) ? "bg-primary text-primary-foreground" : ""}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">DAW</label>
        <div className="flex flex-wrap gap-2">
          {DAWS.map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setDaws((v) => toggle(v, d))}
              className={`px-2 py-1 rounded-full border text-xs ${daws.includes(d) ? "bg-primary text-primary-foreground" : ""}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm">עיר</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border"
          />
        </div>
        <div>
          <label className="block text-sm">שעת מפגש (אופציונלי)</label>
          <input
            placeholder="19:30"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground"
        >
          {loading ? "שולח..." : "שלח בקשה לאישור"}
        </button>
        <div className="text-xs opacity-70 mt-2">
          פתיחת קבוצה תיכנס למצב <b>ממתין לאישור</b>. תקבל עדכון ברגע שאושרה.
        </div>
      </div>
    </form>
  );
}
