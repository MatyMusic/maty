// src/app/(site)/avatars/[genre]/page.tsx
import AvatarMusicClient from "@/components/avatars/AvatarMusicClient";
import { AVATAR_MAP, type AvatarDef, type Genre } from "@/constants/avatars";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageParams = {
  genre: string;
};

// ב-Next 15 typedRoutes: params הוא Promise<PageParams>
type PageProps = {
  params: Promise<PageParams>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { genre } = await params;
  const g = genre as Genre;
  const def = (AVATAR_MAP as Record<string, AvatarDef | undefined>)[g];

  if (!def) {
    return {
      title: "נגן אווטאר — MATY MUSIC",
    };
  }

  return {
    title: `${def.label} — נגן אווטאר | MATY MUSIC`,
  };
}

export default async function AvatarGenrePage({ params }: PageProps) {
  const { genre } = await params;
  const g = genre as Genre;
  const def = (AVATAR_MAP as Record<string, AvatarDef | undefined>)[g];

  if (!def) {
    notFound();
  }

  return (
    <section className="section-padding">
      <div className="container-section max-w-5xl mx-auto">
        <div className="card text-center mb-6">
          <h1 className="text-3xl font-extrabold mb-1">נגן — {def.label}</h1>
          <p className="opacity-80 text-sm md:text-base">
            כאן תוכל לשמוע שירים בסגנון {def.label}. אם אתה אדמין — תוכל גם
            להעלות שירים חדשים לאווטאר הזה.
          </p>
        </div>

        <AvatarMusicClient avatarId={def.id} avatar={def} />
      </div>
    </section>
  );
}
