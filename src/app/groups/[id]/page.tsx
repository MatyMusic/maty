// src/app/groups/[id]/page.tsx
"use client";

import * as React from "react";

type Group = {
  _id: string;
  title: string;
  description?: string;
  sports: string[];
  city?: string | null;
  status: string;
  membersCount: number;
};
type Post = {
  _id: string;
  userId: string;
  content: string;
  createdAt: string;
  audit?: { flagged?: boolean; reason?: string | null } | null;
};

export default function GroupPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [group, setGroup] = React.useState<Group | null>(null);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [text, setText] = React.useState("");
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/groups?limit=1&q=${encodeURIComponent(`"${id}"`)}`, {
      cache: "no-store",
    }).catch(() => {});
    // לטעון את פרטי הקבוצה ישירות מהשרת (אפשר API ייעודי אם תרצה)
    fetch(`/api/admin/groups?status=approved`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        const g = (j.items || []).find((x: any) => x._id === id) || null;
        setGroup(g);
      })
      .catch(() => {});
    fetch(`/api/groups/${id}/posts`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setPosts(j.items || []))
      .catch(() => setPosts([]));
  }, [id]);

  async function send() {
    setErr("");
    if (!text.trim()) return;
    const r = await fetch(`/api/groups/${id}/posts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    const j = await r.json().catch(() => ({}));
    if (!j?.ok) {
      setErr("שליחה נכשלה. ודא/י כניסה ושהקבוצה מאושרת.");
      return;
    }
    setText("");
    setPosts((p) => [j.post, ...p]);
  }

  if (!group)
    return (
      <main className="container-section section-padding rtl" dir="rtl">
        <div className="text-sm text-muted-foreground">טוען קבוצה…</div>
      </main>
    );

  const locked = group.status !== "approved";

  return (
    <main className="container-section section-padding rtl" dir="rtl">
      <div className="mm-card p-4 mb-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold clamp-1">{group.title}</h1>
            <div className="text-sm opacity-80 clamp-2">
              {group.description || "ללא תיאור"}
            </div>
            <div className="text-xs opacity-70 mt-1">
              {group.sports?.join(" • ") || "כללי"}
              {group.city ? ` • ${group.city}` : ""} • {group.membersCount}{" "}
              חברים
            </div>
          </div>
          {locked && (
            <span className="mm-badge mm-badge-brand">ממתין לאישור</span>
          )}
        </div>
      </div>

      {/* קומפוזר פוסט */}
      <div
        className={`mm-card p-4 mb-4 ${locked ? "opacity-60 pointer-events-none" : ""}`}
      >
        <label className="form-label">פוסט חדש</label>
        <textarea
          className="mm-textarea"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="שתפו עדכון / מיקום אימון / שעה..."
        />
        {err && <div className="text-sm text-red-600 mt-1">{err}</div>}
        <div className="mt-2">
          <button className="mm-btn mm-btn-primary" onClick={send}>
            פרסום
          </button>
        </div>
        <div className="text-xs opacity-70 mt-2">
          תוכן עובר סינון בסיסי ומפוקח ע״י אדמין.
        </div>
      </div>

      {/* פיד פוסטים */}
      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p._id} className="mm-card p-3">
            <div className="text-sm whitespace-pre-wrap">{p.content}</div>
            <div className="mt-1 text-[11px] opacity-70">
              {new Date(p.createdAt).toLocaleString("he-IL")}
              {p.audit?.flagged ? " • סומן ע״י מסנן" : ""}
            </div>
          </li>
        ))}
      </ul>

      {!posts.length && (
        <p className="text-sm text-muted-foreground mt-4">אין עדיין פוסטים.</p>
      )}
    </main>
  );
}
