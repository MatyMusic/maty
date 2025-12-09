// src/components/club/useFeedQuery.ts
"use client";
import * as React from "react";
import type { FeedFilters } from "./FeedToolbar";

const LS_KEY = "club:feedFilters";

function readInitial(): FeedFilters {
  // URL > LocalStorage > defaults
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q") || "";
    const genre = url.searchParams.get("genre") || undefined;
    const tag = url.searchParams.get("tag") || undefined;
    const authorId = url.searchParams.get("authorId") || undefined;
    const sort =
      (url.searchParams.get("sort") as FeedFilters["sort"]) || "latest";
    const shortsOnly =
      url.searchParams.get("shorts") === "1" || tag === "shorts";
    return { q, genre, tag, authorId, sort, shortsOnly };
  } catch {
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as FeedFilters) : { q: "", sort: "latest" };
    } catch {
      return { q: "", sort: "latest" };
    }
  }
}

export function useFeedQuery() {
  const [filters, setFilters] = React.useState<FeedFilters>(readInitial);

  // כתיבה ל־URL + LocalStorage
  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const sp = url.searchParams;
      const set = (k: string, v?: string | null) => {
        if (v && v.length) sp.set(k, v);
        else sp.delete(k);
      };
      set("q", filters.q || null);
      set("genre", filters.genre || null);
      set("tag", filters.tag || null);
      set("authorId", filters.authorId || null);
      set("sort", filters.sort || null);
      set("shorts", filters.shortsOnly ? "1" : null);
      const next = url.toString();
      window.history.replaceState(null, "", next);
    } catch {}
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(filters));
    } catch {}
  }, [filters]);

  function patch(p: Partial<FeedFilters>) {
    setFilters((prev) => ({ ...prev, ...p }));
  }

  function reset() {
    setFilters({
      q: "",
      sort: "latest",
      genre: undefined,
      tag: undefined,
      authorId: undefined,
      shortsOnly: false,
    });
  }

  return { filters, patch, reset };
}
