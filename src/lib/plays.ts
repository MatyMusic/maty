// קליינט: לוג השמעות (פעם אחת לשיר לטעינת דף)
const playedOnce = new Set<string>();

export async function logPlay(
  trackId?: string,
  src: "genres" | "club" | "featured" | "trending" | "search" = "genres"
) {
  if (!trackId || playedOnce.has(trackId)) return;
  playedOnce.add(trackId);
  try {
    await fetch("/api/plays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId, src }),
      keepalive: true,
    });
  } catch {}
}
