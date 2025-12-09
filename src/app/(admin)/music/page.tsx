// src/app/(admin)/music/page.tsx
"use client";

import CloudinaryUploadButton from "@/components/admin/CloudinaryUploadButton";
import * as React from "react";

type TrackCategory = "chabad" | "mizrahi" | "soft" | "fun";

type TrackRow = {
  _id: string;
  title: string;
  artist: string;
  category: TrackCategory;
  audioUrl: string;
  coverUrl: string;
  mediaPublicId: string;
  duration: number;
  published: boolean;
  featured: boolean;
  order: number;
  tags: string[];
  externalUrl?: string;
  createdAt?: string | null;
};

type TrackRowWithDirty = TrackRow & {
  dirty?: boolean;
  selected?: boolean;
};

type SavedMedia = {
  kind: "image" | "video" | "audio";
  title?: string;
  publicId: string;
  url: string;
  thumbUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  tags?: string[];
};

type AiSuggestionField = "title" | "tags" | "externalUrl" | "description";

type AiSuggestion = {
  field: AiSuggestionField;
  value: string;
  reason: string;
};

type AiPanelMode = "new" | "existing";

const CAT_LABEL: Record<TrackCategory, string> = {
  chabad: "חסידי (חב״ד)",
  mizrahi: "מזרחי",
  soft: "שקט",
  fun: "מקפיץ",
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatDuration(sec: number) {
  if (!sec || !Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// עטיפת ברירת מחדל לפי ז׳אנר – גם לנגן וגם לעטיפות אוטומטיות
function defaultCoverForCategory(cat: TrackCategory): string {
  switch (cat) {
    case "chabad":
      return "/assets/images/avatar-chabad.png";
    case "mizrahi":
      return "/assets/images/avatar-mizrahi.png";
    case "soft":
      return "/assets/images/avatar-soft.png";
    case "fun":
    default:
      return "/assets/images/avatar-fun.png";
  }
}

// תגים בסיסיים לפי ז׳אנר – משתמשים בטופס החדש + עוזר
function baseTagsForCategory(cat: TrackCategory): string[] {
  switch (cat) {
    case "chabad":
      return ["chabad", "chasidic", "wedding", "farbrengen"];
    case "mizrahi":
      return ["mizrahi", "oriental", "wedding", "hafla"];
    case "soft":
      return ["soft", "chupa", "background", "slow"];
    case "fun":
    default:
      return ["dance", "party", "uplifting", "simcha"];
  }
}

// טיפוס עזר לעוזר החכם – "טראק כללי"
type TrackLike = {
  title: string;
  artist: string;
  category: TrackCategory;
  duration: number;
  tags: string[];
  externalUrl?: string;
  audioUrl?: string;
  coverUrl?: string;
};

// "AI" פיקטיבי בצד לקוח – אפשר להחליף ב־API אמיתי בהמשך
function buildAiSuggestions(track: TrackLike): AiSuggestion[] {
  const suggestions: AiSuggestion[] = [];

  const baseCleanTitle = track.title.trim();
  const baseArtist = track.artist.trim() || "Maty Music";

  // הצעת שם
  if (!baseCleanTitle || baseCleanTitle.length < 4) {
    const byCat: Record<TrackCategory, string[]> = {
      chabad: ["ניגון חב״די שמח", "ניגון דבקות", "ניגון התוועדות"],
      mizrahi: ["פיוט מזרחי מרגש", "קצב מזרחי לחתונה", "שיר נשמה מזרחי"],
      soft: ["בלדה שקטה", "ניגון חופה שקט", "מנגינת רקע עדינה"],
      fun: ["להיט רחבה מקפיץ", "Groove לריקודים", "Party Mix"],
    };
    const arr = byCat[track.category] ?? byCat.chabad;
    const pick = arr[(track.duration || 0) % arr.length] || arr[0];
    suggestions.push({
      field: "title",
      value: `${pick} · ${baseArtist}`,
      reason: "שם מומלץ לפי קטגוריה ואווירה כללית.",
    });
  } else {
    suggestions.push({
      field: "title",
      value: baseCleanTitle,
      reason: "השם הנוכחי נראה לגמרי סבבה, רק לאחד אותו.",
    });
  }

  // הצעת תגים – כולל baseTagsForCategory
  const tagSet = new Set<string>(
    track.tags.map((t) => t.trim()).filter(Boolean),
  );

  baseTagsForCategory(track.category).forEach((t) => tagSet.add(t));

  if (track.duration > 0) {
    if (track.duration > 420) tagSet.add("long");
    if (track.duration < 150) tagSet.add("short");
  }

  suggestions.push({
    field: "tags",
    value: Array.from(tagSet).join(", "),
    reason: "תגים מוצעים לפי קטגוריה, אורך ואופי.",
  });

  // הצעת לינק חיצוני (placeholder לתבניות)
  if (!track.externalUrl?.trim()) {
    suggestions.push({
      field: "externalUrl",
      value: "https://youtu.be/...",
      reason: "הכנס כאן לינק ליוטיוב / אתר חיצוני אם יש.",
    });
  }

  // תיאור / הערה כללית
  const descParts: string[] = [];
  descParts.push(`קטגוריה: ${CAT_LABEL[track.category]}`);
  if (track.duration) {
    descParts.push(`משך: ~${formatDuration(track.duration)}`);
  }
  if (track.tags.length) {
    descParts.push(`תגים קיימים: ${track.tags.join(", ")}`);
  }
  suggestions.push({
    field: "description",
    value: descParts.join(" · "),
    reason: "סיכום טכני שאפשר להעתיק כתיאור, אם תרצה.",
  });

  return suggestions;
}

// בקשה ליצירת עטיפה אוטומטית מ-AI (שרת צד שלנו)
async function requestAutoCoverArt(params: {
  title: string;
  artist: string;
  category: TrackCategory;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/admin/generate-cover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-maty-admin": "1",
      },
      body: JSON.stringify(params),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j?.ok || !j?.url) {
      console.warn("[AI cover] failed:", j);
      return null;
    }
    return j.url as string;
  } catch (e) {
    console.error("[AI cover] error:", e);
    return null;
  }
}

type TracksApiResponse = {
  ok: boolean;
  rows: TrackRow[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AdminMusicPage() {
  const [rows, setRows] = React.useState<TrackRowWithDirty[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(30);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [category, setCategory] = React.useState<TrackCategory | "">("chabad");
  const [query, setQuery] = React.useState("");

  // טופס יצירת טראק חדש
  const [newCat, setNewCat] = React.useState<TrackCategory>("chabad");
  const [newTitle, setNewTitle] = React.useState("");
  const [newArtist, setNewArtist] = React.useState("Maty Music");
  const [newAudioUrl, setNewAudioUrl] = React.useState("");
  const [newCoverUrl, setNewCoverUrl] = React.useState("");
  const [newDuration, setNewDuration] = React.useState(0);
  const [newMediaPublicId, setNewMediaPublicId] = React.useState("");
  const [newExternalUrl, setNewExternalUrl] = React.useState("");
  const [newTags, setNewTags] = React.useState("");
  const [savingNew, setSavingNew] = React.useState(false);

  const [recentUploadInfo, setRecentUploadInfo] = React.useState<string | null>(
    null,
  );

  // מצב עוזר חכם
  const [aiMode, setAiMode] = React.useState<AiPanelMode>("new");
  const [aiSuggestions, setAiSuggestions] = React.useState<
    AiSuggestion[] | null
  >(null);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);

  const [savingRowId, setSavingRowId] = React.useState<string | null>(null);

  const selectedRow = React.useMemo(
    () => rows.find((r) => r._id === selectedRowId) || null,
    [rows, selectedRowId],
  );

  const selectedCount = rows.filter((r) => r.selected).length;
  const allSelected = rows.length > 0 && rows.every((r) => r.selected);

  // טעינת שירים מה־DB
  const loadTracks = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (query.trim()) params.set("q", query.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/admin/tracks?${params.toString()}`, {
        cache: "no-store",
        headers: { "x-maty-admin": "1" },
      });

      const j = (await res.json().catch(() => ({}))) as TracksApiResponse &
        Partial<{ error: string }>;

      if (!res.ok || !j?.ok) {
        throw new Error(j?.error || `HTTP ${res.status}`);
      }

      const nextRows: TrackRowWithDirty[] = (j.rows || []).map((r: any) => ({
        _id: String(r._id),
        title: String(r.title || ""),
        artist: String(r.artist || "Maty Music"),
        category: r.category as TrackCategory,
        audioUrl: String(r.audioUrl || ""),
        coverUrl: String(r.coverUrl || ""),
        mediaPublicId: String(r.mediaPublicId || ""),
        duration: Number(r.duration || 0) || 0,
        published: !!r.published,
        featured: !!r.featured,
        order: Number(r.order || 0) || 0,
        tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
        externalUrl: r.externalUrl || "",
        createdAt: r.createdAt || null,
        dirty: false,
        selected: false,
      }));

      setRows(nextRows);
      setTotal(Number(j.total || nextRows.length));
    } catch (e: any) {
      console.error("[AdminMusicPage] loadTracks error:", e);
      setError(e?.message || "שגיאה בטעינת שירים");
    } finally {
      setLoading(false);
    }
  }, [category, query, page, pageSize]);

  React.useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  // שמירת טראק (יצירה/עדכון) דרך /api/admin/tracks
  async function saveTrack(row: TrackRowWithDirty) {
    try {
      setSavingRowId(row._id);
      const body = {
        title: row.title,
        artist: row.artist,
        category: row.category,
        audioUrl: row.audioUrl,
        coverUrl: row.coverUrl,
        mediaPublicId: row.mediaPublicId,
        duration: row.duration,
        published: row.published,
        featured: row.featured,
        order: row.order,
        tags: row.tags,
        externalUrl: row.externalUrl || "",
      };

      const res = await fetch("/api/admin/tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maty-admin": "1",
        },
        body: JSON.stringify(body),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok || !(j as any)?.ok) {
        throw new Error((j as any)?.error || `HTTP ${res.status}`);
      }

      // מנקים מצב dirty לשורה הזאת אחרי שמירה מוצלחת
      setRows((prev) =>
        prev.map((r) => (r._id === row._id ? { ...r, dirty: false } : r)),
      );
    } catch (e: any) {
      console.error("[AdminMusicPage] saveTrack error:", e);
      alert("שמירת טראק נכשלה: " + (e?.message || "unknown"));
    } finally {
      setSavingRowId(null);
    }
  }

  // מחיקת שירים (חד/רב)
  async function handleDeleteTracks(ids: string[]) {
    if (!ids.length) return;
    try {
      const res = await fetch("/api/admin/tracks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-maty-admin": "1",
        },
        body: JSON.stringify({ ids }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !(j as any)?.ok) {
        throw new Error((j as any)?.error || `HTTP ${res.status}`);
      }
      const deletedCount = Number((j as any).deletedCount || ids.length);
      setRows((prev) => prev.filter((r) => !ids.includes(r._id)));
      setTotal((prev) => Math.max(0, prev - deletedCount));
    } catch (e: any) {
      console.error("[AdminMusicPage] deleteTracks error:", e);
      alert("מחיקת שירים נכשלה: " + (e?.message || "unknown"));
    }
  }

  // כשמעלים קובץ ל-Cloudinary דרך הכפתור (בטופס יצירת שיר חדש)
  const handleMediaUploadedNew = React.useCallback(
    async (doc: SavedMedia) => {
      if (!doc || !doc.publicId) return;

      if (doc.kind !== "audio") {
        alert("הקובץ שהועלה אינו מזוהה כאודיו. ודא שהעלית mp3 / wav וכד'.");
        return;
      }

      const fallbackTitle =
        doc.title || doc.publicId.split("/").pop() || "Track";
      const fallbackCover = defaultCoverForCategory(newCat);

      // עדכון מיידי של הנתונים מההעלאה
      setNewMediaPublicId(doc.publicId);
      setNewAudioUrl(doc.url);
      setNewCoverUrl(doc.thumbUrl || fallbackCover);
      setNewDuration(Number(doc.duration || 0) || 0);
      if (!newTitle) {
        setNewTitle(fallbackTitle);
      }

      setRecentUploadInfo(
        `הועלה קובץ: ${doc.title || doc.publicId} (${Math.round(
          (doc.bytes || 0) / 1024,
        )}KB)`,
      );

      // ניסיון ליצור עטיפה אוטומטית עם AI
      const aiCoverUrl = await requestAutoCoverArt({
        title: newTitle || fallbackTitle,
        artist: newArtist || "Maty Music",
        category: newCat,
      });

      if (aiCoverUrl) {
        setNewCoverUrl(aiCoverUrl);
        setRecentUploadInfo(
          (prev) => (prev || "") + " · נוצרה עטיפה אוטומטית (AI)",
        );
      }
    },
    [newTitle, newArtist, newCat],
  );

  async function handleCreateTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newAudioUrl || !newMediaPublicId) {
      alert("חסר שם שיר או קובץ אודיו / mediaPublicId.");
      return;
    }
    setSavingNew(true);
    try {
      const body = {
        title: newTitle.trim(),
        artist: newArtist.trim() || "Maty Music",
        category: newCat,
        audioUrl: newAudioUrl,
        coverUrl: newCoverUrl || defaultCoverForCategory(newCat),
        mediaPublicId: newMediaPublicId,
        duration: newDuration,
        published: true,
        featured: false,
        order: 0,
        tags: newTags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        externalUrl: newExternalUrl.trim(),
      };

      const res = await fetch("/api/admin/tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maty-admin": "1",
        },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !(j as any)?.ok) {
        throw new Error((j as any)?.error || `HTTP ${res.status}`);
      }

      // ניקוי טופס ורענון רשימה
      setNewTitle("");
      setNewArtist("Maty Music");
      setNewAudioUrl("");
      setNewCoverUrl("");
      setNewDuration(0);
      setNewMediaPublicId("");
      setNewExternalUrl("");
      setNewTags("");
      setRecentUploadInfo("נוצר טראק חדש בהצלחה.");
      await loadTracks();
    } catch (e: any) {
      console.error("[AdminMusicPage] createTrack error:", e);
      alert("יצירת טראק נכשלה: " + (e?.message || "unknown"));
    } finally {
      setSavingNew(false);
    }
  }

  // טריגר לעוזר AI – לטופס החדש
  function handleGenerateAiForNew() {
    setAiError(null);
    setAiBusy(true);
    try {
      const trackLike: TrackLike = {
        title: newTitle,
        artist: newArtist,
        category: newCat,
        duration: newDuration,
        tags: newTags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        externalUrl: newExternalUrl,
        audioUrl: newAudioUrl,
        coverUrl: newCoverUrl,
      };
      const s = buildAiSuggestions(trackLike);
      setAiSuggestions(s);
      setAiMode("new");
    } catch (e: any) {
      setAiError(e?.message || "שגיאה ביצירת הצעות AI (לקוח).");
    } finally {
      setAiBusy(false);
    }
  }

  // טריגר לעוזר AI – לשיר קיים
  function handleGenerateAiForExisting(row: TrackRowWithDirty) {
    setAiError(null);
    setAiBusy(true);
    try {
      const trackLike: TrackLike = {
        title: row.title,
        artist: row.artist,
        category: row.category,
        duration: row.duration,
        tags: row.tags,
        externalUrl: row.externalUrl,
        audioUrl: row.audioUrl,
        coverUrl: row.coverUrl,
      };
      const s = buildAiSuggestions(trackLike);
      setAiSuggestions(s);
      setAiMode("existing");
      setSelectedRowId(row._id);
    } catch (e: any) {
      setAiError(e?.message || "שגיאה ביצירת הצעות AI (לקוח).");
    } finally {
      setAiBusy(false);
    }
  }

  // החלת הצעה על טופס חדש
  function applyAiToNew(field: AiSuggestionField, value: string) {
    if (field === "title") setNewTitle(value);
    if (field === "tags") setNewTags(value);
    if (field === "externalUrl") setNewExternalUrl(value);
  }

  // החלת הצעה על שיר קיים
  function applyAiToExisting(field: AiSuggestionField, value: string) {
    if (!selectedRow) return;
    setRows((prev) =>
      prev.map((row) => {
        if (row._id !== selectedRow._id) return row;
        if (field === "title") return { ...row, title: value, dirty: true };
        if (field === "tags") {
          const tags = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          return { ...row, tags, dirty: true };
        }
        if (field === "externalUrl")
          return { ...row, externalUrl: value, dirty: true };
        return row;
      }),
    );
  }

  return (
    <main
      className="mx-auto max-w-7xl px-4 py-6 space-y-6 text-right"
      dir="rtl"
    >
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">
          ניהול שירים ·{" "}
          <span className="bg-gradient-to-l from-amber-300 to-violet-300 bg-clip-text text-transparent">
            MATY MUSIC
          </span>
        </h1>
        <p className="text-sm opacity-75">
          פאנל אדמין חכם לעריכת טראקים, חיבור ל־Cloudinary, והכנת נתונים עבור
          דפי הז׳אנרים וה־API. בצד ימין יש עוזר חכם (AI) להצעות שם, תגים ועוד.
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,0.9fr)]">
        {/* צד שמאל – טפסים וטבלה */}
        <div className="space-y-6">
          {/* פאנל יצירת טראק חדש */}
          <section className="rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-50/5 via-black/20 to-violet-500/5 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-amber-100">
                  יצירת טראק חדש מהעלאה
                </h2>
                <p className="mt-1 text-xs text-amber-50/80">
                  שלב 1: העלה קובץ אודיו ל־Cloudinary. שלב 2: השלם פרטים ושמור.
                  אם לא בחרת עטיפה – נשתמש בעטיפה לפי ז׳אנר.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiForNew}
                className={classNames(
                  "rounded-xl px-3 py-1.5 text-[11px] font-semibold shadow-sm",
                  aiBusy && aiMode === "new"
                    ? "bg-amber-300/40 text-black cursor-wait"
                    : "bg-amber-300 text-black hover:bg-amber-200",
                )}
              >
                {aiBusy && aiMode === "new" ? "חישוב…" : "🤖 הצעות AI לטופס"}
              </button>
            </div>

            <form
              className="mt-3 grid gap-3 md:grid-cols-2"
              onSubmit={handleCreateTrack}
            >
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs opacity-80">
                    קטגוריה (ז׳אנר / אווטאר)
                  </label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as TrackCategory)}
                    className="w-full rounded-xl border border-white/20 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/50"
                  >
                    {(
                      ["chabad", "mizrahi", "soft", "fun"] as TrackCategory[]
                    ).map((c) => (
                      <option key={c} value={c}>
                        {CAT_LABEL[c]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs opacity-80">
                    שם השיר
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/50"
                    placeholder="למשל: ניגון שמחה · חופה"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs opacity-80">
                    אמן / קרדיט
                  </label>
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/50"
                    placeholder="Maty Music"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs opacity-80">
                    לינק חיצוני (YouTube / Beatport / אתר)
                  </label>
                  <input
                    type="text"
                    value={newExternalUrl}
                    onChange={(e) => setNewExternalUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/40 px-2 py-1.5 text-[11px] outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/50"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs opacity-80">
                    העלאת קובץ אודיו (Cloudinary)
                  </label>
                  <div className="flex items-center gap-2">
                    <CloudinaryUploadButton
                      label="העלה אודיו"
                      className="mm-btn mm-pressable"
                      multiple={false}
                      tags={["track", "audio", newCat]}
                      onSuccess={handleMediaUploadedNew}
                      folder="maty-music/audio"
                    />
                    {newAudioUrl && (
                      <audio
                        controls
                        src={newAudioUrl}
                        className="h-8 w-40 rounded-xl bg-black/40"
                      />
                    )}
                  </div>
                  {recentUploadInfo && (
                    <div className="mt-1 text-[11px] text-amber-100/90">
                      {recentUploadInfo}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs opacity-80">
                    mediaPublicId (נקבל אוטומטית מההעלאה)
                  </label>
                  <input
                    type="text"
                    value={newMediaPublicId}
                    onChange={(e) => setNewMediaPublicId(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/40 px-2 py-1.5 text-[11px] font-mono outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/50"
                    placeholder="maty-music/audio/..."
                  />
                </div>

                <div className="grid grid-cols-[1.5fr_1fr] gap-2">
                  <div>
                    <label className="mb-1 block text-xs opacity-80">
                      כתובת אודיו (audioUrl)
                    </label>
                    <input
                      type="text"
                      value={newAudioUrl}
                      onChange={(e) => setNewAudioUrl(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/40 px-2 py-1.5 text-[11px] outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/50"
                      placeholder="https://res.cloudinary.com/..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs opacity-80">
                      משך (שניות)
                    </label>
                    <input
                      type="number"
                      value={newDuration || 0}
                      onChange={(e) =>
                        setNewDuration(Number(e.target.value) || 0)
                      }
                      className="w-full rounded-xl border border-white/20 bg-black/40 px-2 py-1.5 text-[11px] outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs opacity-80">
                    כתובת עטיפה (coverUrl) – אופציונלי
                  </label>
                  <input
                    type="text"
                    value={newCoverUrl}
                    onChange={(e) => setNewCoverUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-black/40 px-2 py-1.5 text-[11px] outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/50"
                    placeholder="/assets/images/... או Cloudinary"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setNewCoverUrl(defaultCoverForCategory(newCat))
                    }
                    className="mt-1 rounded-xl border border-amber-300/60 bg-amber-300/20 px-2 py-1 text-[10px] text-amber-50 hover:bg-amber-300/40"
                  >
                    עטיפת ז׳אנר ברירת מחדל
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs opacity-80">
                    תגים (מופרדים בפסיק)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/40 px-2 py-1.5 text-[11px] outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-300/50"
                      placeholder="chabad, wedding, live..."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewTags(baseTagsForCategory(newCat).join(", "))
                      }
                      className="whitespace-nowrap rounded-xl border border-amber-300/60 bg-amber-300/20 px-2 py-1 text-[10px] text-amber-50 hover:bg-amber-300/40"
                    >
                      תגים לפי ז׳אנר
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 md:col-span-2">
                <div className="text-[11px] text-amber-50/80">
                  לאחר שמירה, הטראק יהיה זמין ב־
                  <code className="mx-1 rounded bg-black/40 px-1 text-[10px]">
                    /api/music?cat={newCat}
                  </code>
                  וגם בדפי הז׳אנרים – הכל מאותה קולקציית{" "}
                  <span className="font-mono">tracks</span>.
                </div>
                <button
                  type="submit"
                  disabled={
                    savingNew ||
                    !newTitle.trim() ||
                    !newAudioUrl ||
                    !newMediaPublicId
                  }
                  className="rounded-2xl bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50"
                >
                  {savingNew ? "שומר…" : "💾 שמור כטראק חדש"}
                </button>
              </div>
            </form>
          </section>

          {/* סינון + טבלה קיימת */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs opacity-80">קטגוריה:</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as TrackCategory | "");
                    setPage(1);
                  }}
                  className="rounded-xl border border-white/20 bg-black/40 px-2 py-1.5 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/60"
                >
                  <option value="">כל הקטגוריות</option>
                  {(
                    ["chabad", "mizrahi", "soft", "fun"] as TrackCategory[]
                  ).map((c) => (
                    <option key={c} value={c}>
                      {CAT_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ms-auto flex items-center gap-2">
                <input
                  type="text"
                  placeholder="חיפוש לפי שם / אמן / תג…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-52 rounded-xl border border-white/20 bg-black/40 px-3 py-1.5 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/60"
                />
                <button
                  type="button"
                  onClick={loadTracks}
                  className="rounded-xl border border-white/20 bg-black/40 px-3 py-1.5 text-xs hover:border-violet-400/70"
                >
                  רענן
                </button>
              </div>
            </div>

            {/* בר ניהול בחירות / מחיקה */}
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span>
                סה״כ: {total} · עמוד {page}
              </span>
              {selectedCount > 0 && (
                <span className="rounded-full bg-violet-500/20 px-2 py-[2px] text-violet-100">
                  נבחרו {selectedCount} שירים
                </span>
              )}
              <div className="ms-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setRows((prev) =>
                      prev.map((r) => ({ ...r, selected: !allSelected })),
                    )
                  }
                  className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 hover:border-violet-400/60"
                >
                  {allSelected ? "בטל סימון הכל" : "סמן הכל"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRows((prev) =>
                      prev.map((r) => ({ ...r, selected: false })),
                    )
                  }
                  className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 hover:border-violet-400/60"
                >
                  נקה בחירה
                </button>
                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={async () => {
                    if (!selectedCount) return;
                    const ids = rows
                      .filter((r) => r.selected)
                      .map((r) => r._id);
                    if (
                      !window.confirm(
                        `למחוק ${ids.length} שירים נבחרים לצמיתות?`,
                      )
                    ) {
                      return;
                    }
                    await handleDeleteTracks(ids);
                  }}
                  className={classNames(
                    "rounded-lg border px-2 py-1",
                    selectedCount === 0
                      ? "border-rose-400/30 bg-black/30 text-rose-100/40 cursor-not-allowed"
                      : "border-rose-400/70 bg-rose-500/20 text-rose-50 hover:bg-rose-500/30",
                  )}
                >
                  🗑 מחק נבחרים
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-3 rounded-xl border border-rose-400/60 bg-rose-500/10 p-3 text-xs text-rose-100">
                {error} — ודא שאתה מחובר כאדמין.
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.1em] opacity-70">
                  <tr>
                    <th className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRows((prev) =>
                            prev.map((r) => ({ ...r, selected: checked })),
                          );
                        }}
                      />
                    </th>
                    <th className="px-2 py-2 text-right">עטיפה</th>
                    <th className="px-2 py-2 text-right">שם</th>
                    <th className="px-2 py-2 text-right">אמן</th>
                    <th className="px-2 py-2 text-right">קטגוריה</th>
                    <th className="px-2 py-2 text-right">משך</th>
                    <th className="px-2 py-2 text-right">סדר</th>
                    <th className="px-2 py-2 text-right">סטטוס</th>
                    <th className="px-2 py-2 text-right">אודיו</th>
                    <th className="px-2 py-2 text-right">עטיפה</th>
                    <th className="px-2 py-2 text-right">לינק חיצוני</th>
                    <th className="px-2 py-2 text-right">תגים</th>
                    <th className="px-2 py-2 text-right">אקשן</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !rows.length ? (
                    <tr>
                      <td colSpan={13} className="px-2 py-6 text-center">
                        טוען שירים…
                      </td>
                    </tr>
                  ) : !rows.length ? (
                    <tr>
                      <td colSpan={13} className="px-2 py-6 text-center">
                        אין שירים לתצוגה כרגע.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const isSaving = savingRowId === r._id;
                      const isDirty = !!r.dirty;
                      return (
                        <tr
                          key={r._id}
                          className={classNames(
                            "border-t border-white/5 align-middle transition-colors",
                            r.selected
                              ? "bg-violet-500/15"
                              : selectedRowId === r._id
                                ? "bg-violet-500/10"
                                : isDirty
                                  ? "bg-amber-500/5"
                                  : "bg-transparent",
                          )}
                        >
                          {/* בחירה */}
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!r.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row._id === r._id
                                      ? { ...row, selected: checked }
                                      : row,
                                  ),
                                );
                              }}
                            />
                          </td>

                          {/* עטיפה קטנה */}
                          <td className="px-2 py-2">
                            <div className="h-10 w-10 overflow-hidden rounded-lg border border-white/20 bg-black/40">
                              {r.coverUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={r.coverUrl}
                                  alt={r.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[11px] opacity-60">
                                  אין
                                </div>
                              )}
                            </div>
                          </td>

                          {/* שם שיר */}
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={r.title}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row._id === r._id
                                      ? { ...row, title: v, dirty: true }
                                      : row,
                                  ),
                                );
                              }}
                              className="w-40 rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-[11px] outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/60"
                            />
                          </td>

                          {/* אמן */}
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={r.artist}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row._id === r._id
                                      ? { ...row, artist: v, dirty: true }
                                      : row,
                                  ),
                                );
                              }}
                              className="w-32 rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-[11px] outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/60"
                            />
                          </td>

                          {/* קטגוריה */}
                          <td className="px-2 py-2">
                            <select
                              value={r.category}
                              onChange={(e) => {
                                const v = e.target.value as TrackCategory;
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row._id === r._id
                                      ? { ...row, category: v, dirty: true }
                                      : row,
                                  ),
                                );
                              }}
                              className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-[11px] outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/60"
                            >
                              {(
                                [
                                  "chabad",
                                  "mizrahi",
                                  "soft",
                                  "fun",
                                ] as TrackCategory[]
                              ).map((c) => (
                                <option key={c} value={c}>
                                  {CAT_LABEL[c]}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* משך */}
                          <td className="px-2 py-2 whitespace-nowrap">
                            {formatDuration(r.duration)}
                          </td>

                          {/* סדר */}
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              value={r.order || 0}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row._id === r._id
                                      ? { ...row, order: v, dirty: true }
                                      : row,
                                  ),
                                );
                              }}
                              className="w-16 rounded-lg border border-white/20 bg-black/40 px-1 py-0.5 text-center text-[11px] outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/60"
                            />
                          </td>

                          {/* סטטוס */}
                          <td className="px-2 py-2">
                            <div className="flex flex-col gap-1 text-[11px]">
                              <label className="inline-flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={r.published}
                                  onChange={async (e) => {
                                    const val = e.target.checked;
                                    const rowToSave: TrackRowWithDirty = {
                                      ...r,
                                      published: val,
                                      dirty: true,
                                    };
                                    setRows((prev) =>
                                      prev.map((x) =>
                                        x._id === r._id
                                          ? {
                                              ...x,
                                              published: val,
                                              dirty: true,
                                            }
                                          : x,
                                      ),
                                    );
                                    await saveTrack(rowToSave);
                                  }}
                                />
                                <span>מפורסם</span>
                              </label>
                              <label className="inline-flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={r.featured}
                                  onChange={async (e) => {
                                    const val = e.target.checked;
                                    const rowToSave: TrackRowWithDirty = {
                                      ...r,
                                      featured: val,
                                      dirty: true,
                                    };
                                    setRows((prev) =>
                                      prev.map((x) =>
                                        x._id === r._id
                                          ? {
                                              ...x,
                                              featured: val,
                                              dirty: true,
                                            }
                                          : x,
                                      ),
                                    );
                                    await saveTrack(rowToSave);
                                  }}
                                />
                                <span>Hero / מובלט</span>
                              </label>
                            </div>
                          </td>

                          {/* לינק אודיו + נגן */}
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={r.audioUrl}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row._id === r._id
                                      ? { ...row, audioUrl: v, dirty: true }
                                      : row,
                                  ),
                                );
                              }}
                              className="w-60 rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-[10px] font-mono outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/60"
                            />
                            {r.audioUrl && (
                              <audio
                                controls
                                src={r.audioUrl}
                                className="mt-1 h-7 w-full rounded-lg bg-black/40"
                              />
                            )}
                          </td>

                          {/* עטיפה – לינק + כפתורי AI / ז׳אנר */}
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={r.coverUrl}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row._id === r._id
                                      ? { ...row, coverUrl: v, dirty: true }
                                      : row,
                                  ),
                                );
                              }}
                              className="w-56 rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-[10px] font-mono outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/60"
                            />
                            <div className="mt-1 flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const url = defaultCoverForCategory(
                                    r.category,
                                  );
                                  setRows((prev) =>
                                    prev.map((row) =>
                                      row._id === r._id
                                        ? {
                                            ...row,
                                            coverUrl: url,
                                            dirty: true,
                                          }
                                        : row,
                                    ),
                                  );
                                }}
                                className="rounded-lg border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] hover:border-violet-400/70"
                              >
                                עטיפת ז׳אנר ברירת מחדל
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const url = await requestAutoCoverArt({
                                    title: r.title,
                                    artist: r.artist,
                                    category: r.category,
                                  });
                                  if (!url) {
                                    alert("יצירת עטיפה אוטומטית נכשלה");
                                    return;
                                  }
                                  const updated: TrackRowWithDirty = {
                                    ...r,
                                    coverUrl: url,
                                    dirty: true,
                                  };
                                  setRows((prev) =>
                                    prev.map((row) =>
                                      row._id === r._id ? updated : row,
                                    ),
                                  );
                                  await saveTrack(updated);
                                }}
                                className="rounded-lg border border-amber-300/80 bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-50 hover:bg-amber-300/40"
                              >
                                🎨 עטיפה אוטומטית (AI)
                              </button>
                            </div>
                          </td>

                          {/* לינק חיצוני */}
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={r.externalUrl || ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row._id === r._id
                                      ? { ...row, externalUrl: v, dirty: true }
                                      : row,
                                  ),
                                );
                              }}
                              className="w-52 rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-[10px] font-mono outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/60"
                            />
                          </td>

                          {/* תגים */}
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={r.tags.join(", ")}
                              onChange={(e) => {
                                const ts = e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                setRows((prev) =>
                                  prev.map((row) =>
                                    row._id === r._id
                                      ? { ...row, tags: ts, dirty: true }
                                      : row,
                                  ),
                                );
                              }}
                              className="w-44 rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-[10px] outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/60"
                            />
                          </td>

                          {/* אקשן */}
                          <td className="space-y-1 px-2 py-2">
                            <button
                              type="button"
                              disabled={isSaving || !r.dirty}
                              onClick={() => void saveTrack(r)}
                              className={classNames(
                                "mb-1 block w-full rounded-lg px-2 py-1 text-[11px] font-semibold",
                                r.dirty
                                  ? "border border-emerald-400/70 bg-emerald-500/20 hover:bg-emerald-500/30"
                                  : "border border-white/20 bg-black/30 text-slate-200",
                                isSaving && "opacity-60 cursor-wait",
                              )}
                            >
                              {isSaving
                                ? "שומר..."
                                : r.dirty
                                  ? "💾 שמור"
                                  : "✓ שמור"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRowId(r._id);
                                handleGenerateAiForExisting(r);
                              }}
                              className="mb-1 block w-full rounded-lg border border-violet-400/70 bg-violet-500/20 px-2 py-1 text-[11px] hover:bg-violet-500/30"
                            >
                              🤖 הצעות AI לשורה
                            </button>
                            <a
                              href={r.audioUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-center text-[11px] hover:border-violet-400/70"
                            >
                              נגן בקונסול חיצוני
                            </a>
                            {r.externalUrl && (
                              <a
                                href={r.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-center text-[11px] hover:border-sky-400/70"
                              >
                                לינק חיצוני
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    `למחוק את "${r.title}" לצמיתות?`,
                                  )
                                ) {
                                  return;
                                }
                                await handleDeleteTracks([r._id]);
                              }}
                              className="block w-full rounded-lg border border-rose-400/70 bg-rose-500/20 px-2 py-1 text-[11px] text-rose-50 hover:bg-rose-500/30"
                            >
                              🗑 מחק שיר
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* עימוד */}
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <span>
                סה״כ: {total} · עמוד {page}
              </span>
              <div className="ms-auto flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 disabled:opacity-40"
                >
                  « ראשון
                </button>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 disabled:opacity-40"
                >
                  ‹ קודם
                </button>
                <button
                  type="button"
                  disabled={rows.length < pageSize}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-white/20 bg-black/40 px-2 py-1 disabled:opacity-40"
                >
                  הבא ›
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value) || 30)}
                  className="rounded-lg border border-white/20 bg-black/40 px-2 py-1"
                >
                  {[10, 20, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} בעמוד
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* צד ימין – עוזר חכם */}
        <aside className="sticky top-4 space-y-3 rounded-2xl border border-violet-400/40 bg-gradient-to-b from-violet-950/70 to-black/70 p-4 text-xs shadow-lg">
          <h2 className="flex items-center gap-2 text-sm font-bold text-violet-100">
            🤖 עוזר חכם (AI)
            <span className="rounded-full border border-violet-300/40 px-2 py-[2px] text-[10px] uppercase tracking-[0.18em] text-violet-200">
              preview
            </span>
          </h2>
          <p className="text-[11px] text-violet-50/80">
            כאן תראה הצעות חכמות לשמות, תגים ולינקים – לפי הטראק שבטופס החדש או
            לפי שורה שנבחרה בטבלה. כרגע ההיגיון רץ בצד לקוח; אפשר לחבר כאן בהמשך
            API אמיתי למודלי AI.
          </p>

          <div className="flex items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={handleGenerateAiForNew}
              className={classNames(
                "flex-1 rounded-xl px-3 py-1.5 font-semibold",
                aiMode === "new"
                  ? "bg-amber-300 text-black"
                  : "bg-black/40 text-amber-100 border border-amber-200/40",
              )}
            >
              טופס חדש
            </button>
            <button
              type="button"
              disabled={!selectedRow}
              onClick={() =>
                selectedRow ? handleGenerateAiForExisting(selectedRow) : null
              }
              className={classNames(
                "flex-1 rounded-xl px-3 py-1.5 font-semibold",
                !selectedRow
                  ? "bg-black/30 text-violet-200/40 cursor-not-allowed border border-violet-300/20"
                  : aiMode === "existing"
                    ? "bg-violet-400 text-black"
                    : "bg-black/40 text-violet-100 border border-violet-300/40",
              )}
            >
              עריכת טראק קיים
            </button>
          </div>

          {aiError && (
            <div className="rounded-xl border border-rose-400/60 bg-rose-500/10 p-2 text-[11px] text-rose-50">
              {aiError}
            </div>
          )}

          <div className="mt-2 space-y-2">
            {!aiSuggestions?.length ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-white/70">
                עדיין אין הצעות. לחץ על{" "}
                <span className="font-semibold">"🤖 הצעות AI"</span> בטופס החדש
                או בשורה בטבלה.
              </div>
            ) : (
              aiSuggestions.map((s, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/15 bg-black/40 p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/70">
                      {s.field === "title"
                        ? "שם שיר"
                        : s.field === "tags"
                          ? "תגים"
                          : s.field === "externalUrl"
                            ? "לינק חיצוני"
                            : "תיאור / הערה"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (aiMode === "new") {
                          applyAiToNew(s.field, s.value);
                        } else {
                          applyAiToExisting(s.field, s.value);
                        }
                      }}
                      className="rounded-lg bg-violet-400 px-2 py-[2px] text-[10px] font-semibold text-black hover:bg-violet-300"
                    >
                      החל הצעה
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-words rounded-lg bg-black/60 px-2 py-1 text-[11px] text-violet-50">
                    {s.value}
                  </pre>
                  <p className="mt-1 text-[10px] text-white/60">{s.reason}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
