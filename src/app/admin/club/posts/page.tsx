// src/app/admin/club/posts/page.tsx
"use client";
import React from "react";
import Link from "next/link";

type Item = {
  id: string;
  createdAt: string;
  authorId: string;
  text: string;
  status: "pending" | "approved" | "rejected";
  images: string[];
  audioUrl: string | null;
  videoUrl: string | null;
  mode: "post" | "poll" | "audio";
};

export default function AdminClubPostsPage() {
  const [tab, setTab] = React.useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/club/posts?status=${tab}`, {
        cache: "no-store",
      });
      const j = await r.json();
      setItems(j?.items || []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, [tab]);

  async function changeStatus(id: string, status: "approved" | "rejected") {
    const r = await fetch(`/api/club/posts/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const j = await r.json();
    if (j?.ok) {
      setItems((arr) => arr.filter((x) => x.id !== id));
    } else {
      alert(j?.error || "שגיאה");
    }
  }

  const TabBtn = ({ k, label }: { k: typeof tab; label: string }) => (
    <button
      onClick={() => setTab(k)}
      className={`rounded-xl border px-3 py-1.5 text-sm ${tab === k ? "bg-violet-600 text-white border-violet-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-900"}`}
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6" dir="rtl">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">תור אישורים — MAY-CLUB</h1>
        <nav className="flex items-center gap-2">
          <Link
            href="/club/feed"
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            חזרה לפיד
          </Link>
          <Link
            href="/club/compose"
            className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            יצירת פוסט
          </Link>
        </nav>
      </header>

      <section className="mt-4 flex items-center gap-2">
        <TabBtn k="pending" label="ממתינים" />
        <TabBtn k="approved" label="מאושרים" />
        <TabBtn k="rejected" label="נדחו" />
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          רענן
        </button>
      </section>

      <section className="mt-4">
        {loading ? (
          <div className="text-sm opacity-70">טוען…</div>
        ) : items.length === 0 ? (
          <div className="text-sm opacity-70">אין פריטים</div>
        ) : (
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="rounded-2xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm opacity-70">
                    {new Date(it.createdAt).toLocaleString("he-IL")} • {it.mode}{" "}
                    • {it.authorId}
                  </div>
                  <div className="flex gap-2">
                    {it.status === "pending" && (
                      <>
                        <button
                          onClick={() => changeStatus(it.id, "approved")}
                          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        >
                          אשר
                        </button>
                        <button
                          onClick={() => changeStatus(it.id, "rejected")}
                          className="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        >
                          דחה
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {it.text && (
                  <p className="mt-2 text-sm whitespace-pre-wrap">{it.text}</p>
                )}

                {(it.images?.length || it.videoUrl || it.audioUrl) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {it.images?.slice(0, 4).map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt=""
                        className="w-28 h-20 object-cover rounded-lg border"
                      />
                    ))}
                    {it.videoUrl && (
                      <a
                        className="text-xs underline"
                        href={it.videoUrl}
                        target="_blank"
                      >
                        וידאו
                      </a>
                    )}
                    {it.audioUrl && (
                      <audio
                        controls
                        src={it.audioUrl}
                        className="w-full max-w-xs"
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
