// src/lib/club/api.ts

// טיפוס גנרי קטן לגמישות
type JSONVal = any;

/**
 * מוסיף headers בסיסיים + credentials ל־fetch בצד הקליינט.
 */
const withDefaults = (o: RequestInit = {}): RequestInit => {
  const h = new Headers(o.headers as HeadersInit | undefined);
  if (!h.has("accept")) h.set("accept", "application/json");
  if (!h.has("content-type") && o.body) {
    h.set("content-type", "application/json");
  }
  return { credentials: "include", ...o, headers: h };
};

/**
 * קריאת JSON עם הגנה על 204 / קריסה.
 */
const j = async (r: Response): Promise<JSONVal> =>
  r.status === 204 ? null : await r.json().catch(() => null);

/* ───────── תגובות: יצירת תגובה בסיסית (טקסט בלבד) ───────── */

export async function commentCreate(postId: string, body: string) {
  const r = await fetch(
    "/api/club/comments",
    withDefaults({
      method: "POST",
      body: JSON.stringify({ postId, body }),
    }),
  );

  const data = await j(r);
  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || `${r.status}`);
  }
  return data as { ok: true; item: any };
}

/* ───────── לייקים לפוסטים ───────── */

/**
 * מחזיר מצב לייק לפוסט:
 *  - האם המשתמש הנוכחי סימן לייק
 *  - כמה לייקים יש לפוסט בפועל
 *
 * משתמש בראוט:
 *   GET /api/club/posts/[id]/like
 */
export async function likeStatus(postId: string): Promise<{
  liked: boolean;
  likeCount: number;
}> {
  if (!postId) {
    throw new Error("missing_post_id");
  }

  const r = await fetch(
    `/api/club/posts/${encodeURIComponent(postId)}/like`,
    withDefaults({ method: "GET" }),
  );

  const data = await j(r);
  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || `${r.status}`);
  }

  const liked = !!data.liked;
  const rawCount = data.likeCount;
  const likeCount =
    typeof rawCount === "number" && Number.isFinite(rawCount) ? rawCount : 0;

  return { liked, likeCount };
}

/**
 * מדליק/מכבה לייק לפוסט עבור המשתמש הנוכחי.
 *
 * משתמש בראוט:
 *   POST /api/club/posts/[id]/like
 *   body: { on?: boolean }
 *
 * אם אין התחברות:
 *   – הראוט מחזיר 401 → אנחנו זורקים Error("unauthorized")
 *   – LikeButton ו־PostCard תופסים את השגיאה ומחזירים מצב אחורה.
 */
export async function likeToggle(
  postId: string,
  on: boolean,
): Promise<{
  liked: boolean;
  likeCount: number;
}> {
  if (!postId) {
    throw new Error("missing_post_id");
  }

  const r = await fetch(
    `/api/club/posts/${encodeURIComponent(postId)}/like`,
    withDefaults({
      method: "POST",
      body: JSON.stringify({ on }),
    }),
  );

  // לא מחובר
  if (r.status === 401) {
    // כאן LikeButton/ PostCard תופסים את השגיאה לפי message === "unauthorized"
    throw new Error("unauthorized");
  }

  const data = await j(r);
  if (!r.ok || !data?.ok) {
    throw new Error(data?.error || `${r.status}`);
  }

  const liked = !!data.liked;
  const rawCount = data.likeCount;
  const likeCount =
    typeof rawCount === "number" && Number.isFinite(rawCount) ? rawCount : 0;

  return { liked, likeCount };
}
