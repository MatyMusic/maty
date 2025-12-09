import { fetchJson } from "@/lib/fit/util";

const YT = process.env.YOUTUBE_API_KEY || "";

export async function findYoutubeId(q: string): Promise<string | null> {
  if (!YT) return null;
  const url = `https://www.googleapis.com/youtube/v3/search?part=id&type=video&maxResults=1&q=${encodeURIComponent(q)}&key=${YT}`;
  const data = await fetchJson(url);
  const id = data?.items?.[0]?.id?.videoId;
  return id || null;
}
