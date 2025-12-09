// src/app/api/ai/search/route.ts
import { getDb } from "@/lib/mongo";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const qRaw = searchParams.get("q") || "";
    const q = qRaw.trim();
    if (!q) {
      return NextResponse.json(
        { ok: false, error: "EMPTY_QUERY" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const regex = new RegExp(escapeRegExp(q), "i");

    // ───────── שירים ─────────
    const songsPromise = (async () => {
      try {
        const col = db.collection("songs");
        let docs: any[] = [];
        try {
          // אם יש אינדקס טקסט – משתמשים בו
          docs = await col
            .find({ $text: { $search: q } }, {
              projection: {
                score: { $meta: "textScore" },
                title: 1,
                title_he: 1,
                title_he_norm: 1,
                artist: 1,
                singer: 1,
                cat: 1,
                category: 1,
                tags: 1,
                slug: 1,
                url: 1,
              },
            } as any)
            .sort({ score: { $meta: "textScore" }, createdAt: -1 } as any)
            .limit(16)
            .toArray();
        } catch {
          // fallback – regex
          docs = await col
            .find(
              {
                $or: [
                  { title: regex },
                  { title_he: regex },
                  { title_he_norm: regex },
                  { keywords: regex },
                  { tags: regex },
                ],
              },
              {
                projection: {
                  title: 1,
                  title_he: 1,
                  title_he_norm: 1,
                  artist: 1,
                  singer: 1,
                  cat: 1,
                  category: 1,
                  tags: 1,
                  slug: 1,
                  url: 1,
                },
              },
            )
            .limit(16)
            .toArray();
        }

        return docs.map((d) => ({
          id: String(d._id),
          title: d.title_he_norm || d.title_he || d.title || "שיר ללא שם",
          artist: d.artist || d.singer || undefined,
          cat: d.cat || d.category || undefined,
          tags: Array.isArray(d.tags) ? d.tags : [],
          url:
            d.url ||
            (d.slug
              ? `/songs/${encodeURIComponent(d.slug)}`
              : `/songs/${encodeURIComponent(String(d._id))}`),
        }));
      } catch {
        return [] as any[];
      }
    })();

    // ───────── פוסטים / CLUB / JAM / FIT ─────────
    const postsPromise = (async () => {
      try {
        const col = db.collection("posts");
        const docs = await col
          .find(
            {
              $or: [
                { title: regex },
                { title_he: regex },
                { body: regex },
                { content: regex },
                { text: regex },
                { tags: regex },
              ],
            },
            {
              projection: {
                title: 1,
                title_he: 1,
                section: 1,
                kind: 1,
                slug: 1,
                excerpt: 1,
                body: 1,
                content: 1,
              },
            },
          )
          .limit(16)
          .toArray();

        return docs.map((d) => {
          const section = d.section || d.kind || "club";
          const basePath =
            section === "jam" || section === "fit" || section === "club"
              ? section
              : "club";
          const url = d.slug
            ? `/${basePath}/${encodeURIComponent(d.slug)}`
            : `/${basePath}`;

          const rawText = d.excerpt || d.body || d.content || "";
          const excerpt =
            typeof rawText === "string"
              ? rawText.replace(/\s+/g, " ").slice(0, 160)
              : "";

          return {
            id: String(d._id),
            title: d.title_he || d.title || "פוסט ללא כותרת",
            kind: d.kind || undefined,
            section: basePath,
            slug: d.slug || undefined,
            excerpt,
            url,
          };
        });
      } catch {
        return [] as any[];
      }
    })();

    // ───────── MATY-DATE – פרופילים ─────────
    const profilesPromise = (async () => {
      try {
        // שם קולקציה – אפשר להתאים אצלך: "date_profiles" / "profiles" / "maty_date_profiles"
        const col =
          db.collection("date_profiles" as any) ||
          db.collection("profiles" as any);

        const docs = await col
          .find(
            {
              $or: [
                { name: regex },
                { nickname: regex },
                { city: regex },
                { headline: regex },
                { bio: regex },
              ],
            },
            {
              projection: {
                name: 1,
                nickname: 1,
                city: 1,
                age: 1,
                headline: 1,
              },
            },
          )
          .limit(16)
          .toArray();

        return docs.map((d) => ({
          id: String(d.userId || d._id),
          name: d.name || d.nickname || "פרופיל ללא שם",
          city: d.city || undefined,
          age: d.age || undefined,
          headline: d.headline || undefined,
          url: `/date/profile/${encodeURIComponent(String(d.userId || d._id))}`,
        }));
      } catch {
        return [] as any[];
      }
    })();

    const [songs, posts, profiles] = await Promise.all([
      songsPromise,
      postsPromise,
      profilesPromise,
    ]);

    return NextResponse.json({
      ok: true,
      q,
      songs,
      posts,
      profiles,
    });
  } catch (err) {
    console.error("AI search error:", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
