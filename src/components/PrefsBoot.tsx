// src/components/PrefsBoot.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

type Genre = "chabad" | "mizrahi" | "soft" | "fun";
const isGenre = (g: any): g is Genre => ["chabad","mizrahi","soft","fun"].includes(g);

export function PrefsBoot() {
  const { data, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) Fallback מקומי רק כשאין session
    if (status !== "authenticated" || !data?.user) {
      try {
        const ls = localStorage.getItem("preferredStyle");
        if (ls && isGenre(ls)) {
          window.dispatchEvent(new CustomEvent("mm:setCategory", { detail: { category: ls } }));
          (window as any).SiteCompanion?.setGenre?.(ls);
          console.info("[PrefsBoot] local fallback:", ls);
        }
      } catch {}
      return;
    }

    // 2) כשמחוברים — מושכים מהשרת, אבל *בלי* ברירת מחדל ל-soft
    const key = `__PrefsBootRan:${pathname || "/"}`;
    if ((window as any)[key]) return;
    (window as any)[key] = true;

    let canceled = false;
    (async () => {
      try {
        const r = await fetch("/api/user/prefs", { cache: "no-store" });
        if (!r.ok) {
          if (r.status === 401) {
            console.info("[PrefsBoot] 401 prefs (race), skip");
          } else {
            console.info("[PrefsBoot] prefs not ok:", r.status);
          }
          return;
        }
        const j = await r.json().catch(() => null);
        if (!j) return;

        const fromServer: any = j.lastPlayedGenre ?? (j.preferredGenres?.[0]);
        if (!isGenre(fromServer)) {
          console.info("[PrefsBoot] no genre in server prefs, not overriding.");
          return; // ← לא לדרדר ל-soft כשאין ערך
        }
        if (!canceled) {
          window.dispatchEvent(new CustomEvent("mm:setCategory", { detail: { category: fromServer } }));
          (window as any).SiteCompanion?.setGenre?.(fromServer);
          console.info("[PrefsBoot] applied server genre:", fromServer);
        }
      } catch (e) {
        if (!canceled) console.warn("[PrefsBoot] prefs fetch error:", e);
      }
    })();

    return () => { canceled = true; };
  }, [data, status, pathname]);

  return null;
}
