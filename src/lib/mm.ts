// src/lib/mm.ts
// ================================================================
// MATY — Music & Avatar Utils (SSR-safe, Cross-tab sync, Hooks)
// ================================================================

/** קטגוריות נתמכות */
export type CategoryKey = "chabad" | "mizrahi" | "soft" | "fun";

/** אסטרטגיית אווטאר */
export type AvatarStrategy = "genre" | "gallery" | "upload" | "profile";

/** מפות אווטארים — זהות למה שיש ב-public/assets/images */
export const AVATAR_BY_GENRE: Record<CategoryKey, string> = {
  chabad: "/assets/images/avatar-chabad.png",
  mizrahi: "/assets/images/avatar-mizrahi.png",
  soft: "/assets/images/avatar-soft.png",
  fun: "/assets/images/avatar-fun.png",
};

/** גלריה מובנית (id -> url) */
export const GALLERY_MAP: Record<string, string> = {
  "avatar-chabad": "/assets/images/avatar-chabad.png",
  "avatar-mizrahi": "/assets/images/avatar-mizrahi.png",
  "avatar-soft": "/assets/images/avatar-soft.png",
  "avatar-fun": "/assets/images/avatar-fun.png",
};

/** קבועי אירועים ל־window */
export const EV_SET_CATEGORY = "mm:setCategory";
export const EV_AVATAR_CHANGED = "mm:avatarChanged";

/** מפתחות אחסון מקומי */
const LS_CAT = "mm-cat";
const LS_AVATAR_STRATEGY = "mm-avatar-strategy";
const LS_AVATAR_URL = "mm-avatar-url";
const LS_AVATAR_ID = "mm-avatar-id";

/** עזרי סביבה */
function isClient() {
  return typeof window !== "undefined";
}

/** בדיקת קטגוריה */
export function isCat(x: any): x is CategoryKey {
  return x === "chabad" || x === "mizrahi" || x === "soft" || x === "fun";
}

/** שמירה/קריאה בטוחה מ־localStorage */
function lsSet(key: string, val: string) {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(key, val);
  } catch {}
}
function lsGet(key: string): string | null {
  if (!isClient()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** קטגוריית ברירת מחדל (ל־SSR ולמקרה שאין אחסון מקומי) */
export function getInitialCategory(): CategoryKey {
  if (!isClient()) return "fun";
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("cat");
    const ls = lsGet(LS_CAT);
    const candidate = (q || ls || "fun") as string;
    return isCat(candidate) ? (candidate as CategoryKey) : "fun";
  } catch {
    return "fun";
  }
}

/** קובע קטגוריה: מעדכן URL, localStorage ומשדר אירוע mm:setCategory */
export function setCategory(cat: CategoryKey, opts?: { push?: boolean }) {
  if (!isClient() || !isCat(cat)) return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("cat", cat);
    const fn: "pushState" | "replaceState" = opts?.push
      ? "pushState"
      : "replaceState";
    window.history[fn](null, "", url.toString());
  } catch {}
  lsSet(LS_CAT, cat);
  try {
    window.dispatchEvent(
      new CustomEvent(EV_SET_CATEGORY, { detail: { category: cat } }),
    );
  } catch {}
}

/** הרשמה לשינוי קטגוריה; מחזיר פונקציית ביטול */
export function onCategoryChange(cb: (cat: CategoryKey) => void) {
  if (!isClient()) return () => {};
  const handler = (e: Event) => {
    const d = (e as CustomEvent).detail;
    if (d?.category && isCat(d.category)) cb(d.category);
  };
  window.addEventListener(EV_SET_CATEGORY, handler as EventListener);

  // סנכרון בין טאבים
  const storageHandler = (ev: StorageEvent) => {
    if (
      ev.key === LS_CAT &&
      typeof ev.newValue === "string" &&
      isCat(ev.newValue)
    ) {
      cb(ev.newValue);
    }
  };
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(EV_SET_CATEGORY, handler as EventListener);
    window.removeEventListener("storage", storageHandler);
  };
}

/** גלובלים של אווטאר — עבור PrefsBoot/דפים ששומרים מראש */
export function getAvatarGlobals(): {
  strategy: AvatarStrategy | null;
  url: string | null;
  id: string | null;
} {
  if (!isClient()) return { strategy: null, url: null, id: null };
  return {
    strategy:
      ((window as any).__MM_AVATAR_STRATEGY__ as AvatarStrategy | null) ??
      (lsGet(LS_AVATAR_STRATEGY) as AvatarStrategy | null) ??
      null,
    url:
      ((window as any).__MM_AVATAR_URL__ as string | null) ??
      lsGet(LS_AVATAR_URL),
    id:
      ((window as any).__MM_AVATAR_ID__ as string | null) ??
      lsGet(LS_AVATAR_ID),
  };
}

/** סט אסטרטגיית אווטאר + פייר אירוע */
export function setAvatarStrategy(
  strategy: AvatarStrategy,
  payload?: { url?: string | null; id?: string | null },
) {
  if (!isClient()) return;
  (window as any).__MM_AVATAR_STRATEGY__ = strategy;
  if (payload?.url !== undefined)
    (window as any).__MM_AVATAR_URL__ = payload.url;
  if (payload?.id !== undefined) (window as any).__MM_AVATAR_ID__ = payload.id;

  // התמדה ל־localStorage (למקרה של רענון/טאבים)
  lsSet(LS_AVATAR_STRATEGY, strategy);
  if (payload?.url !== undefined && payload.url !== null)
    lsSet(LS_AVATAR_URL, payload.url);
  if (payload?.id !== undefined && payload.id !== null)
    lsSet(LS_AVATAR_ID, payload.id);

  try {
    window.dispatchEvent(
      new CustomEvent(EV_AVATAR_CHANGED, {
        detail: {
          strategy,
          url: payload?.url ?? null,
          id: payload?.id ?? null,
        },
      }),
    );
  } catch {}
}

/** פתרון URL אווטאר לפי אסטרטגיה */
export function resolveAvatarURL(args: {
  strategy?: AvatarStrategy | null;
  category?: CategoryKey | null;
  galleryId?: string | null;
  uploadedUrl?: string | null;
  profileUrl?: string | null;
}): string {
  const strat = args.strategy ?? getAvatarGlobals().strategy ?? "genre";
  switch (strat) {
    case "upload":
      return (
        args.uploadedUrl ||
        getAvatarGlobals().url ||
        "" ||
        AVATAR_BY_GENRE[args.category || getInitialCategory()]
      );
    case "gallery": {
      const id = args.galleryId || getAvatarGlobals().id || "";
      return (
        GALLERY_MAP[id] ||
        AVATAR_BY_GENRE[args.category || getInitialCategory()]
      );
    }
    case "profile":
      return (
        args.profileUrl ||
        AVATAR_BY_GENRE[args.category || getInitialCategory()]
      );
    case "genre":
    default:
      return AVATAR_BY_GENRE[args.category || getInitialCategory()];
  }
}

/** עזרי ניווט קטגוריות */
export function cycleCategory(current?: CategoryKey): CategoryKey {
  const order: CategoryKey[] = ["chabad", "mizrahi", "soft", "fun"];
  const idx = Math.max(0, order.indexOf(current || getInitialCategory()));
  const next = order[(idx + 1) % order.length];
  setCategory(next, { push: true });
  return next;
}
export function resetCategory() {
  setCategory("fun", { push: false });
}

/** התמדה לשרת (אופציונלי): שמירת העדפות משתמש */
export async function persistPrefs(prefs: {
  category?: CategoryKey;
  avatarStrategy?: AvatarStrategy;
  avatarUrl?: string | null;
  avatarId?: string | null;
}) {
  try {
    await fetch("/api/user/prefs", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(prefs),
    });
  } catch {}
}

// ================================================================
// React Hooks — שימוש נוח בקומפוננטות
// ================================================================
import * as React from "react";

/** hook: קטגוריה חיה (URL/LS/אירוע/טאבים) */
export function useCategory(): [
  CategoryKey,
  (c: CategoryKey, opts?: { push?: boolean }) => void,
] {
  const [cat, setCat] = React.useState<CategoryKey>(getInitialCategory());

  React.useEffect(() => {
    // מאזין לאירוע פנימי
    const off = onCategoryChange((c) => setCat(c));
    // מאזין ל־storage (לטאבים אחרים)
    const storageHandler = (ev: StorageEvent) => {
      if (
        ev.key === LS_CAT &&
        typeof ev.newValue === "string" &&
        isCat(ev.newValue)
      )
        setCat(ev.newValue);
    };
    if (isClient()) window.addEventListener("storage", storageHandler);
    return () => {
      off();
      if (isClient()) window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const set = React.useCallback((c: CategoryKey, opts?: { push?: boolean }) => {
    setCategory(c, opts);
  }, []);

  return [cat, set];
}

/** hook: אסטרטגיית אווטאר חיה */
export function useAvatarStrategy() {
  const [strategy, setStrategyState] = React.useState<AvatarStrategy | null>(
    getAvatarGlobals().strategy ?? "genre",
  );
  const [url, setUrl] = React.useState<string | null>(
    getAvatarGlobals().url ?? null,
  );
  const [id, setId] = React.useState<string | null>(
    getAvatarGlobals().id ?? null,
  );

  React.useEffect(() => {
    if (!isClient()) return;
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (d.strategy) setStrategyState(d.strategy);
      if ("url" in d) setUrl(d.url ?? null);
      if ("id" in d) setId(d.id ?? null);
    };
    window.addEventListener(EV_AVATAR_CHANGED, handler as EventListener);

    // סנכרון בין טאבים
    const storageHandler = (ev: StorageEvent) => {
      if (ev.key === LS_AVATAR_STRATEGY && ev.newValue)
        setStrategyState(ev.newValue as AvatarStrategy);
      if (ev.key === LS_AVATAR_URL) setUrl(ev.newValue);
      if (ev.key === LS_AVATAR_ID) setId(ev.newValue);
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener(EV_AVATAR_CHANGED, handler as EventListener);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const set = React.useCallback(
    (
      next: AvatarStrategy,
      payload?: { url?: string | null; id?: string | null },
    ) => {
      setAvatarStrategy(next, payload);
    },
    [],
  );

  return { strategy, url, id, set };
}

/** hook: קבלת URL סופי לאווטאר לפי האסטרטגיה והקטגוריה */
export function useResolvedAvatar(args?: {
  category?: CategoryKey | null;
  galleryId?: string | null;
  uploadedUrl?: string | null;
  profileUrl?: string | null;
}) {
  const [cat] = useCategory();
  const { strategy, url, id } = useAvatarStrategy();
  return React.useMemo(
    () =>
      resolveAvatarURL({
        strategy: strategy ?? "genre",
        category: args?.category ?? cat,
        galleryId: args?.galleryId ?? id ?? null,
        uploadedUrl: args?.uploadedUrl ?? url ?? null,
        profileUrl: args?.profileUrl ?? null,
      }),
    [
      strategy,
      cat,
      args?.galleryId,
      args?.uploadedUrl,
      args?.profileUrl,
      url,
      id,
    ],
  );
}
