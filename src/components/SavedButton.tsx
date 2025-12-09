"use client";
import { useState } from "react";
import { toast } from "react-hot-toast";

type Props = {
  item: {
    id: string; // itemId לדוגמה: "nig_<id>"
    source: "nigunim" | "local" | "youtube" | "spotify";
    title: string;
    artists?: string[];
    cover?: string;
    url?: string;
    link?: string;
  };
  initiallySaved?: boolean;
};

export default function SavedButton({ item, initiallySaved }: Props) {
  const [saved, setSaved] = useState(!!initiallySaved);

  async function save() {
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          source: item.source,
          title: item.title,
          artists: item.artists,
          cover: item.cover,
          url: item.url,
          link: item.link,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(true);
      toast.success("נשמר לשירים שלי");
    } catch {
      toast.error("לא הצלחתי לשמור");
    }
  }

  async function remove() {
    try {
      const res = await fetch(`/api/saved/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      setSaved(false);
      toast("הוסר מהשמורים");
    } catch {
      toast.error("לא הצלחתי להסיר");
    }
  }

  return saved ? (
    <button
      onClick={remove}
      className="px-3 py-1 rounded-lg bg-violet-600 text-white"
    >
      שמור ✔
    </button>
  ) : (
    <button
      onClick={save}
      className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800"
    >
      שמור ☆
    </button>
  );
}
