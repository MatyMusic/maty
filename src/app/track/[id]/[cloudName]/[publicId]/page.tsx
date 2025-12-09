// src/app/track/[cloudName]/[publicId]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCollection } from "@/lib/mongo";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ cloudName: string; publicId: string }>;
}) {
  const { publicId } = await params;
  const col = await getCollection("media");
  const doc = await col.findOne({ publicId });
  if (!doc) notFound();

  const track = {
    id: doc.publicId,
    title: doc.title || doc.publicId,
    artist: "Maty Music",
    src: doc.url,
    cover: doc.thumbUrl,
  };

  return (
    <section className="container-section section-padding" dir="rtl">
      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <div className="relative h-48 w-48 md:h-56 md:w-56 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
          {track.cover && (
            <Image src={track.cover} alt={track.title} fill className="object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{track.title}</h1>
          <p className="opacity-75 mt-1">{track.artist}</p>

          <div className="mt-4 flex gap-2">
            {/* ינגן בפרו-פלייר הגלובלי */}
            <form
              action="#"
              onSubmit={(e) => {
                e.preventDefault();
                // שולח לאירוע הגלובלי – פרו-פלייר מאזין לזה
                // @ts-expect-error window event custom
                window.dispatchEvent(new CustomEvent("mm:play", { detail: { track } }));
              }}
            >
              <button className="btn bg-brand text-white border-0">נגן עכשיו</button>
            </form>
            <Link href="/" className="btn">לדף הבית</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
