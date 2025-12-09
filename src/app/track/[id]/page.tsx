// src/app/track/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollection } from "@/lib/mongo";
import TrackClient from "@/components/music/TrackClient";

export const dynamic = "force-dynamic";

type MediaDoc = {
  _id: any;
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
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

function toJSON(x: any) {
  return JSON.parse(JSON.stringify(x));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const col = await getCollection("media");
  const doc = await col.findOne({ publicId: params.id, kind: "audio" });
  if (!doc) return { title: "שיר לא נמצא — MATY MUSIC" };
  const title = doc.title || doc.publicId;
  return {
    title: `${title} — MATY MUSIC`,
    description: `האזינו ל-${title} ב־MATY MUSIC`,
    openGraph: {
      title,
      description: `האזינו ל-${title} ב־MATY MUSIC`,
      images: doc.thumbUrl ? [{ url: doc.thumbUrl }] : undefined,
    },
  };
}

export default async function TrackPage({ params }: { params: { id: string } }) {
  const col = await getCollection("media");
  const track = (await col.findOne({ publicId: params.id, kind: "audio" })) as MediaDoc | null;
  if (!track) notFound();

  // נזהה קטגוריה מתוך התגיות
  const TAGS = Array.isArray(track.tags) ? track.tags : [];
  const CATS = ["chabad", "mizrahi", "soft", "fun"];
  const cat =
    TAGS.map(String).map(t => t.replace(/^cat:/, "")).find(t => CATS.includes(t)) || null;

  // “עוד מהקטגוריה” — שירים דומים
  const related = cat
    ? await col
        .find({
          kind: "audio",
          publicId: { $ne: track.publicId },
          $or: [{ tags: `cat:${cat}` }, { tags: cat }],
        })
        .project({ _id: 1, title: 1, publicId: 1, url: 1, thumbUrl: 1, duration: 1, tags: 1, format: 1, createdAt: 1 })
        .sort({ createdAt: -1, _id: -1 })
        .limit(12)
        .toArray()
    : [];

  return (
    <TrackClient
      track={toJSON(track)}
      related={toJSON(related)}
      cat={cat}
    />
  );
}
