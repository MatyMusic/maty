// src/app/assistant/links/page.tsx
"use client";
import * as React from "react";

type LinkCard = {
  title: string;
  href: string;
  subtitle?: string;
  external?: boolean;
};

export default function AssistantLinksPage() {
  const [q, setQ] = React.useState("");
  const [links, setLinks] = React.useState<LinkCard[]>([]);
  const [answer, setAnswer] = React.useState<string>("");

  async function run() {
    setLinks([]);
    setAnswer("");
    const r = await fetch("/api/assistant/router", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, path: window.location.pathname }),
    });
    const j = await r.json();
    if (j?.ok && j.type === "links") setLinks(j.links || []);
    if (j?.ok && j.type === "answer") setAnswer(j.answer || "");
  }

  return (
    <div dir="rtl" className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-extrabold mb-3">Assistant Links Router</h1>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="כתוב כוונה… למשל: “חפש ניגון חתונה”, “כתוב פוסט ב-CLUB”"
          className="flex-1 h-12 rounded-2xl px-4 border"
        />
        <button
          onClick={run}
          className="h-12 px-5 rounded-2xl bg-brand text-white font-bold"
        >
          הפעל
        </button>
      </div>

      {answer && (
        <div className="mt-4 p-3 rounded-xl border bg-black/5 dark:bg-white/10">
          {answer}
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {links.map((lnk, i) => (
            <a
              key={i}
              href={lnk.href}
              target={lnk.external ? "_blank" : "_self"}
              rel={lnk.external ? "noopener noreferrer" : undefined}
              className="block rounded-xl border p-3 bg-white/85 dark:bg-neutral-900/85 hover:bg-white dark:hover:bg-neutral-800 transition"
            >
              <div className="font-semibold">{lnk.title}</div>
              {lnk.subtitle && (
                <div className="text-xs opacity-70 mt-0.5">{lnk.subtitle}</div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
