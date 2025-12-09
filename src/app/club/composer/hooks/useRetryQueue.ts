"use client";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { safeJson } from "../lib/utils";

type PendingItem = { id: string; createdAt: string; payload: any };
const QUEUE_KEY = "club:composer:retry-queue";

function nowIso() {
  return new Date().toISOString();
}

export function useRetryQueue() {
  function enqueue(payload: any) {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      const arr: PendingItem[] = raw ? JSON.parse(raw) : [];
      arr.push({
        id: Math.random().toString(36).slice(2),
        createdAt: nowIso(),
        payload,
      });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(arr));
    } catch {}
  }

  async function flushPending() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      const arr: PendingItem[] = raw ? JSON.parse(raw) : [];
      if (!arr.length) {
        toast("אין פריטים בתור", { icon: "ℹ️" });
        return;
      }
      const ok: PendingItem[] = [];
      const fail: PendingItem[] = [];
      for (const it of arr) {
        try {
          const res = await fetch("/api/club/posts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            cache: "no-store",
            body: JSON.stringify(it.payload),
          });
          const j = await safeJson(res);
          if (!res.ok || !j?.ok)
            throw new Error(j?.error || "HTTP " + res.status);
          ok.push(it);
        } catch {
          fail.push(it);
        }
      }
      if (ok.length) toast.success(`הועלו בהצלחה ${ok.length} פריטים מהתור`);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(fail));
    } catch {}
  }

  // listen to global enqueue events
  useEffect(() => {
    const onEnq = (e: any) => enqueue(e?.detail?.payload);
    const onOnline = () => flushPending();
    window.addEventListener("mm:club:enqueue", onEnq as EventListener);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("mm:club:enqueue", onEnq as EventListener);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return { enqueuePending: enqueue, flushPending };
}
