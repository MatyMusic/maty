// src/components/HeroPlayer.tsx  (Server Component)
import ProPlayer from "@/components/ProPlayer";

export default async function HeroPlayer() {
  const r = await fetch("/api/tracks?featured=1&limit=20", { cache: "no-store" });
  const j = await r.json().catch(()=>({}));
  const rows = Array.isArray(j?.rows) ? j.rows : [];

  const queue = rows.map((t: any, i: number) => ({
    id: `trk-${i}`,
    title: t.title,
    artist: t.artist || "Maty Music",
    src: t.audioUrl,
    cover: t.coverUrl || "/assets/logo/maty-music-wordmark.svg",
  }));

  return <ProPlayer initialQueue={queue} />;
}
