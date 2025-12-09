// src/lib/nigunim-repo.ts
import { Db, ObjectId } from "mongodb";
import { getNigunimDb } from "@/lib/db-nigunim";

export type NigunQuery = {
  q?: string; // חיפוש חופשי בכותרת/אומן/אלבום
  tags?: string[]; // מסנן תגיות
  origin?: ("internet-archive" | "chabad.info")[]; // מקור
  type?: ("audio" | "embed")[]; // סוג תוצאה
  limit?: number;
  page?: number; // דף 1..N (דפדוף פשוט)
  sort?: "new" | "title"; // ברירת מחדל: new
};

function buildRegex(q?: string) {
  if (!q) return null;
  try {
    return new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  } catch {
    return null;
  }
}

export async function searchNigunim(params: NigunQuery) {
  const db: Db = await getNigunimDb();
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
  const page = Math.max(params.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const wantsAudio = !params.type || params.type.includes("audio");
  const wantsEmbed = !params.type || params.type.includes("embed");

  const rx = buildRegex(params.q);
  const commonTagMatch =
    params.tags && params.tags.length ? { tags: { $in: params.tags } } : {};
  const originFilterAudio = params.origin?.length
    ? { origin: { $in: params.origin } }
    : {};
  const originFilterEmbed = params.origin?.length
    ? { origin: { $in: params.origin } }
    : {};

  const matchAudio: any = { ...commonTagMatch, ...originFilterAudio };
  const matchEmbed: any = { ...commonTagMatch, ...originFilterEmbed };

  if (rx) {
    matchAudio.$or = [{ title: rx }, { artist: rx }, { album: rx }];
    matchEmbed.$or = [{ title: rx }];
  }

  const sortStage =
    params.sort === "title"
      ? { title: 1, updatedAt: -1 }
      : { updatedAt: -1, _id: -1 };

  // पाइپליין אחוד עם $unionWith כדי להחזיר מבנה אחיד
  const basePipe: any[] = [];

  if (wantsAudio) {
    basePipe.push(
      { $match: matchAudio },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: { $ifNull: ["$artist", "Unknown"] },
          album: 1,
          year: 1,
          tags: 1,
          origin: 1,
          type: { $literal: "audio" },
          url: "$audioUrl",
          coverUrl: 1,
          sourceUrl: "$sourceItemUrl",
          updatedAt: 1,
        },
      },
    );
  } else {
    basePipe.push({ $match: { _id: { $exists: false } } }); // דמה ריק
  }

  if (wantsEmbed) {
    basePipe.push({
      $unionWith: {
        coll: "nigun_embed",
        pipeline: [
          { $match: matchEmbed },
          {
            $project: {
              _id: 1,
              title: 1,
              artist: { $ifNull: ["$creditedTo", "Chabad.info"] },
              album: 1,
              year: 1,
              tags: 1,
              origin: 1,
              type: { $literal: "embed" },
              url: "$embedUrl",
              coverUrl: 1,
              sourceUrl: "$pageUrl",
              updatedAt: 1,
            },
          },
        ],
      },
    });
  }

  basePipe.push({ $sort: sortStage }, { $skip: skip }, { $limit: limit });

  // מריצים מעל nigun_audio (גם אם מבוקש רק embed, זה עדיין בסדר)
  const cursor = db
    .collection("nigun_audio")
    .aggregate(basePipe, { allowDiskUse: true });
  const items = await cursor.toArray();

  return { items, page, limit };
}
