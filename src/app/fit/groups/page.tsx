// src/app/fit/groups/page.tsx
"use client";

import * as React from "react";

/* =========================================================
   תרגומים/קבועים
   ========================================================= */
const SPORTS_HE = [
  { k: "running", v: "ריצה" },
  { k: "walking", v: "הליכה" },
  { k: "gym", v: "חד״כ" },
  { k: "yoga", v: "יוגה" },
  { k: "pilates", v: "פילאטיס" },
  { k: "hiit", v: "HIIT" },
  { k: "cycling", v: "רכיבה" },
  { k: "crossfit", v: "קרוספיט" },
  { k: "swimming", v: "שחייה" },
  { k: "football", v: "כדורגל" },
  { k: "basketball", v: "כדורסל" },
] as const;

const LEVELS = [
  { k: "", v: "ללא" },
  { k: "beginner", v: "מתחילים" },
  { k: "intermediate", v: "ביניים" },
  { k: "advanced", v: "מתקדמים" },
] as const;

type SportKey = (typeof SPORTS_HE)[number]["k"];
type LevelKey = (typeof LEVELS)[number]["k"];
type SortBy = "recent" | "members" | "title";

type Group = {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  city?: string | null;
  sports: SportKey[];
  level?: LevelKey | null;
  members: string[];
};

/* =========================================================
   Utilities
   ========================================================= */
function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

// slugify תואם עברית, ללא תווי ׳/״ לא חוקיים — המפתחות מצוטטים!
function slugifyHe(input: string) {
  const base = (input || "").trim();

  // נירמול בסיסי, הסרת ניקוד/סימנים משולבים
  let s = base
    .normalize("NFKD")
    .replace(/[\u0591-\u05BD\u05BF-\u05C7\u0300-\u036f]/g, "");

  // מיפוי תעתיק מינימלי (כולל גרש/גרשיים כמחרוזות!)
  const map: Record<string, string> = {
    א: "a",
    ב: "b",
    ג: "g",
    ד: "d",
    ה: "h",
    ו: "v",
    ז: "z",
    ח: "h",
    ט: "t",
    י: "y",
    כ: "k",
    ך: "k",
    ל: "l",
    מ: "m",
    ם: "m",
    נ: "n",
    ן: "n",
    ס: "s",
    ע: "a",
    פ: "p",
    ף: "p",
    צ: "ts",
    ץ: "ts",
    ק: "k",
    ר: "r",
    ש: "sh",
    ת: "t",
    "\u05F3": "", // ׳ GERESH
    "\u05F4": "", // ״ GERSHAYIM
    "–": "-",
    "—": "-",
    "־": "-", // מקפים
  };

  s = s
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");

  // ניקוי כללי -> אותיות לטיניות/ספרות/מקף
  s = s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return s || "group";
}

function sportLabel(k: string) {
  return SPORTS_HE.find((s) => s.k === k)?.v || k;
}
function levelLabel(k?: string | null) {
  return LEVELS.find((x) => x.k === (k || ""))?.v || "—";
}

/* =========================================================
   עמוד קבוצות
   ========================================================= */
export default function FitGroupsPage() {
  // נתונים
  const [rows, setRows] = React.useState<Group[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  // פילטרים
  const [q, setQ] = React.useState("");
  const [city, setCity] = React.useState("");
  const [sportAny, setSportAny] = React.useState<SportKey[]>([]);
  const [level, setLevel] = React.useState<LevelKey>("");
  const [sortBy, setSortBy] = React.useState<SortBy>("recent");

  const qDebounced = useDebounced(q);
  const cityDebounced = useDebounced(city);

  // UI
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [openCreate, setOpenCreate] = React.useState(false);

  // סנכרון URL
  React.useEffect(() => {
    const usp = new URLSearchParams();
    if (q.trim()) usp.set("q", q.trim());
    if (city.trim()) usp.set("city", city.trim());
    if (sportAny.length) usp.set("sport_any", sportAny.join(","));
    if (level) usp.set("level", level);
    if (sortBy !== "recent") usp.set("sort", sortBy);
    const url = `${window.location.pathname}?${usp.toString()}`;
    window.history.replaceState(null, "", url);
  }, [q, city, sportAny, level, sortBy]);

  // טעינה ראשונית מה-URL
  React.useEffect(() => {
    const usp = new URLSearchParams(window.location.search);
    const q0 = usp.get("q") ?? "";
    const city0 = usp.get("city") ?? "";
    const level0 = (usp.get("level") as LevelKey | null) ?? "";
    const sort0 = (usp.get("sort") as SortBy | null) ?? "recent";
    const sportAny0 = usp.get("sport_any") ?? "";

    if (q0) setQ(q0);
    if (city0) setCity(city0);
    if (level0) setLevel(level0);
    if (sort0 === "members" || sort0 === "title" || sort0 === "recent")
      setSortBy(sort0);

    if (sportAny0) {
      setSportAny(
        sportAny0
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean) as SportKey[],
      );
    }
  }, []);

  // מיון צד־לקוח
  function sortClient(list: Group[], by: SortBy) {
    const arr = [...list];
    if (by === "members") {
      arr.sort((a, b) => (b.members?.length ?? 0) - (a.members?.length ?? 0));
    } else if (by === "title") {
      arr.sort((a, b) => a.title.localeCompare(b.title, "he"));
    } else {
      // recent — נשמור סדר השרת; fallback לפי _id
      arr.sort((a, b) => String(b._id).localeCompare(String(a._id)));
    }
    return arr;
  }

  // טעינה
  async function load(reset = true) {
    setErr("");
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      if (!hasMore || loading) return;
      setLoading(true);
    }

    try {
      const u = new URL("/api/fit/groups", window.location.origin);
      if (qDebounced.trim()) u.searchParams.set("q", qDebounced.trim());
      if (cityDebounced.trim())
        u.searchParams.set("city", cityDebounced.trim());
      if (sportAny.length) u.searchParams.set("sport_any", sportAny.join(","));
      if (level) u.searchParams.set("level", level);
      u.searchParams.set("page", reset ? "1" : String(page + 1));
      u.searchParams.set("limit", "24");

      const r = await fetch(u.toString(), { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || "שגיאה בטעינה");

      const got: Group[] = Array.isArray(j.items) ? j.items : [];
      const merged = reset ? got : [...rows, ...got];

      setRows(sortClient(merged, sortBy));
      setPage(reset ? 1 : page + 1);
      setHasMore((j.pages ?? 1) > (reset ? 1 : page + 1));
    } catch (e: any) {
      setErr(e?.message || "שגיאה בטעינה");
    } finally {
      setLoading(false);
    }
  }

  // כל שינוי פילטר => ריענון
  React.useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, cityDebounced, sportAny.join(","), level]);

  // שינוי מיון => עדכון מקומי
  React.useEffect(() => {
    setRows((prev) => sortClient(prev, sortBy));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  function toggleSport(k: SportKey) {
    setSportAny((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  }
  function resetFilters() {
    setQ("");
    setCity("");
    setSportAny([]);
    setLevel("");
    setSortBy("recent");
  }

  return (
    <main dir="rtl" className="container mx-auto max-w-6xl px-4 py-8">
      {/* כותרת + פעולות */}
      <header className="mb-4">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">קבוצות ספורט</h1>
            <p className="text-sm opacity-70">
              הצטרפו לקבוצה פעילה, או פתחו קבוצה חדשה — פרסום הקבוצה לאחר אישור
              מנהל.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-xs opacity-70">מיון:</span>
              <select
                className="mm-select h-9"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                aria-label="מיון תוצאות"
              >
                <option value="recent">חדשים</option>
                <option value="members">מס׳ חברים</option>
                <option value="title">שם קבוצה (א׳-ת׳)</option>
              </select>
            </div>
            <button className="mm-btn" onClick={() => setOpenCreate(true)}>
              + פתח קבוצה
            </button>
          </div>
        </div>
      </header>

      {/* סינון */}
      <section className="mm-card p-4 mb-4">
        <div className="grid gap-2 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <label className="form-label text-xs opacity-70">חיפוש</label>
            <input
              className="mm-input"
              placeholder="שם קבוצה / תיאור"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="חיפוש חופשי"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="form-label text-xs opacity-70">עיר</label>
            <input
              className="mm-input"
              placeholder="לדוגמה: נתניה"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="עיר"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="form-label text-xs opacity-70">רמת קבוצה</label>
            <select
              className="mm-select"
              value={level}
              onChange={(e) => setLevel(e.target.value as LevelKey)}
              aria-label="רמת קבוצה"
            >
              {LEVELS.map((lv) => (
                <option key={lv.k} value={lv.k}>
                  {lv.v}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="form-label text-xs opacity-70">פעולות</label>
            <div className="flex gap-2">
              <button className="mm-btn" onClick={() => load(true)}>
                חפש
              </button>
              <button className="mm-btn" onClick={resetFilters}>
                איפוס
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xs opacity-70 mb-1">סוגי אימון</div>
          <div className="flex flex-wrap gap-1.5">
            {SPORTS_HE.map((s) => {
              const active = sportAny.includes(s.k as SportKey);
              return (
                <button
                  key={s.k}
                  type="button"
                  className={[
                    "h-9 px-3 rounded-full border text-sm mm-pressable",
                    active
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white/90 dark:bg-neutral-950/80",
                  ].join(" ")}
                  onClick={() => toggleSport(s.k as SportKey)}
                  aria-pressed={active}
                >
                  {s.v}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* שגיאה */}
      {err && (
        <div className="text-red-600 text-sm mb-3" role="alert">
          {err}
        </div>
      )}

      {/* רשימה */}
      {loading && rows.length === 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="rounded-2xl border p-4 animate-pulse h-40 bg-black/5 dark:bg-white/10"
            />
          ))}
        </ul>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((g) => (
              <li key={g.slug} className="mm-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold clamp-1">{g.title}</div>
                    <div className="text-xs opacity-70 clamp-1">
                      {g.city ?? "—"} • {g.sports?.map(sportLabel).join(" / ")}{" "}
                      • {levelLabel(g.level)}
                    </div>
                  </div>
                  <span className="mm-badge">
                    {g.members?.length ?? 0} חברים
                  </span>
                </div>

                {g.description && (
                  <p className="text-sm mt-2 opacity-80 clamp-2">
                    {g.description}
                  </p>
                )}

                <div className="mt-3 flex gap-2">
                  <JoinButtons slug={g.slug} />
                  <a
                    href={`/fit/groups/${encodeURIComponent(g.slug)}`}
                    className="mm-btn"
                  >
                    פרטים
                  </a>
                </div>
              </li>
            ))}
          </ul>

          {!rows.length && !loading && (
            <p className="opacity-60 mt-6">אין קבוצות תואמות כרגע.</p>
          )}

          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                className="mm-btn"
                disabled={loading}
                onClick={() => load(false)}
              >
                {loading ? "טוען…" : "טען עוד"}
              </button>
            </div>
          )}
        </>
      )}

      {/* דיאלוג יצירה */}
      {openCreate && (
        <CreateDialog
          onClose={() => setOpenCreate(false)}
          onDone={() => {
            setOpenCreate(false);
            load(true);
          }}
        />
      )}
    </main>
  );
}

/* =========================================================
   הצטרפות/עזיבה
   ========================================================= */
function JoinButtons({ slug }: { slug: string }) {
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  async function call(kind: "join" | "leave") {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(
        `/api/fit/groups/${encodeURIComponent(slug)}/${kind}`,
        { method: "POST" },
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || "פעולה נכשלה");
      setMsg(kind === "join" ? "הצטרפת לקבוצה" : "עזבת את הקבוצה");
    } catch (e: any) {
      setMsg(e?.message || "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button className="mm-btn" disabled={busy} onClick={() => call("join")}>
        הצטרף/י
      </button>
      <button className="mm-btn" disabled={busy} onClick={() => call("leave")}>
        עזוב/י
      </button>
      {msg && <span className="text-xs opacity-70">{msg}</span>}
    </div>
  );
}

/* =========================================================
   דיאלוג יצירת קבוצה
   ========================================================= */
function CreateDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [slug, setSlug] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [city, setCity] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [visibility, setVisibility] = React.useState<"public" | "private">(
    "public",
  );
  const [sports, setSports] = React.useState<SportKey[]>([]);
  const [level, setLevel] = React.useState<LevelKey>("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [okMsg, setOkMsg] = React.useState("");

  // יצירת slug אוטומטית מהשם (אם לא הוזן ידנית)
  React.useEffect(() => {
    if (!title) return;
    if (!slug || slug === "group") setSlug(slugifyHe(title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  function toggleSport(k: SportKey) {
    setSports((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  }

  function validate() {
    if (!title.trim()) return "שם קבוצה נדרש";
    if (!slug.trim()) return "Slug נדרש";
    if (!/^[a-z0-9-]{3,}$/.test(slug))
      return "Slug חייב להיות באנגלית/ספרות/מקפים (3+ תווים)";
    if (sports.length === 0) return "בחר/י לפחות סוג אימון אחד";
    return "";
  }

  async function submit() {
    setErr("");
    setOkMsg("");
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/fit/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          description: desc,
          city,
          sports,
          level: level || null,
          visibility,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || "שגיאה בשליחה");
      setOkMsg("הבקשה נשלחה וממתינה לאישור מנהל.");
      // איפוס רך
      setTitle("");
      setSlug("");
      setCity("");
      setDesc("");
      setSports([]);
      setLevel("");
      setVisibility("public");
      setTimeout(() => onDone(), 900);
    } catch (e: any) {
      setErr(e?.message || "שגיאה בשליחה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200]" aria-modal="true" role="dialog">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-x-0 top-[6%] mx-auto max-w-[680px] mm-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-lg font-bold">פתיחת קבוצה חדשה</div>
          <button className="mm-btn" onClick={onClose}>
            סגור
          </button>
        </div>

        <div className="grid gap-3 mt-3">
          {/* שם + slug */}
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="form-label">שם קבוצה *</label>
              <input
                className="mm-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="רצי תל-אביב"
                maxLength={80}
              />
            </div>
            <div>
              <label className="form-label">Slug (לטיני) *</label>
              <input
                className="mm-input input-ltr"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-")
                      .replace(/-+/g, "-")
                      .replace(/^-+|-+$/g, ""),
                  )
                }
                placeholder="tel-aviv-runners"
                maxLength={80}
              />
              <div className="text-xs opacity-70 ltr mt-1">
                /{slug || "group"}
              </div>
            </div>
          </div>

          {/* עיר + נראות */}
          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="form-label">עיר</label>
              <input
                className="mm-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="לדוגמה: ת״א"
                maxLength={80}
              />
            </div>
            <div>
              <label className="form-label">נראות</label>
              <select
                className="mm-select"
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as "public" | "private")
                }
              >
                <option value="public">ציבורית (מופיעה בחיפוש)</option>
                <option value="private">פרטית (עם קישור ישיר)</option>
              </select>
            </div>
          </div>

          {/* תיאור */}
          <div>
            <label className="form-label">תיאור</label>
            <textarea
              className="mm-textarea"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              placeholder="קצת על מטרת הקבוצה, ימים ושעות, קצב/רמה וכו׳…"
              maxLength={800}
            />
          </div>

          {/* ספורט + רמה */}
          <div>
            <label className="form-label">סוגי אימון *</label>
            <div className="flex flex-wrap gap-1.5">
              {SPORTS_HE.map((s) => {
                const active = sports.includes(s.k as SportKey);
                return (
                  <button
                    key={s.k}
                    type="button"
                    onClick={() => toggleSport(s.k as SportKey)}
                    className={[
                      "h-9 px-3 rounded-full border text-sm mm-pressable",
                      active
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white/90 dark:bg-neutral-950/80",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {s.v}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label className="form-label">רמת קבוצה</label>
              <select
                className="mm-select"
                value={level}
                onChange={(e) => setLevel(e.target.value as LevelKey)}
              >
                {LEVELS.map((lv) => (
                  <option key={lv.k} value={lv.k}>
                    {lv.v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* הודעות */}
          {err && (
            <div className="text-red-600 text-sm" role="alert">
              {err}
            </div>
          )}
          {okMsg && <div className="text-green-700 text-sm">{okMsg}</div>}

          {/* פעולות */}
          <div className="flex gap-2">
            <button className="mm-btn" disabled={busy} onClick={submit}>
              שליחה לאישור אדמין
            </button>
            <button className="mm-btn" onClick={onClose}>
              ביטול
            </button>
          </div>

          <div className="text-xs opacity-70">
            * לאחר שליחה, הקבוצה תופיע כ־“ממתינה” עד אישור מנהל. המנהל רואה הכל
            ומאשר ידנית.
          </div>
        </div>
      </div>
    </div>
  );
}
