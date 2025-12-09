import "dotenv/config";
import fs from "fs";
import path from "path";
import readline from "readline";
import nigunClientPromise from "@/lib/mongo-nigunim";

type Row = {
  slug: string;
  title: string;
  artists?: string[];
  source: "youtube" | "spotify";
  link?: string;
  cover?: string;
  duration?: number;
  tags?: string[];
};

function arg(flag: string, def?: string) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : def;
}
const pos1 =
  process.argv[2] && !process.argv[2].startsWith("-")
    ? process.argv[2]
    : undefined; // per
const pos2 =
  process.argv[3] && !process.argv[3].startsWith("-")
    ? process.argv[3]
    : undefined; // pages
const pos3 =
  process.argv[4] && !process.argv[4].startsWith("-")
    ? process.argv[4]
    : undefined; // queries

const PER = Math.max(1, Math.min(50, Number(arg("--per", pos1 || "50")))); // עד 50 ביוטיוב
const PAGES = Math.max(1, Math.min(50, Number(arg("--pages", pos2 || "10"))));
const QUERIES = path.resolve(
  process.cwd(),
  arg("--queries", pos3 || "scripts/queries-nigunim.txt")
);
const USE_YT =
  process.argv.includes("--youtube") || !process.argv.includes("--spotify");
const USE_SP = process.argv.includes("--spotify");

const YT = process.env.YOUTUBE_API_KEY || "";
const SP_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SP_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";

function slugify(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .slice(0, 128);
}

function parseISODurationToSeconds(iso?: string): number | undefined {
  if (!iso) return;
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!m) return;
  const h = Number(m[1] || 0),
    mi = Number(m[2] || 0),
    s = Number(m[3] || 0);
  return h * 3600 + mi * 60 + s;
}

async function* readQueries() {
  if (!fs.existsSync(QUERIES))
    throw new Error(`queries file not found: ${QUERIES}`);
  const rl = readline.createInterface({
    input: fs.createReadStream(QUERIES),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const q = line.trim();
    if (q) yield q;
  }
}

async function youtubeHarvest(
  query: string,
  per: number,
  pages: number
): Promise<Row[]> {
  if (!YT) return [];
  const out: Row[] = [];
  let pageToken = "";
  for (let i = 0; i < pages; i++) {
    const search = new URL("https://www.googleapis.com/youtube/v3/search");
    search.searchParams.set("key", YT);
    search.searchParams.set("q", query);
    search.searchParams.set("part", "snippet");
    search.searchParams.set("type", "video");
    search.searchParams.set("maxResults", String(Math.min(per, 50)));
    if (pageToken) search.searchParams.set("pageToken", pageToken);
    const sr = await fetch(search, { cache: "no-store" });
    const sj: any = await sr.json().catch(() => ({}));
    const ids: string[] = (sj.items || [])
      .map((it: any) => it?.id?.videoId)
      .filter(Boolean);
    if (!ids.length) break;

    const details = new URL("https://www.googleapis.com/youtube/v3/videos");
    details.searchParams.set("key", YT);
    details.searchParams.set("id", ids.join(","));
    details.searchParams.set("part", "snippet,contentDetails");
    const dr = await fetch(details, { cache: "no-store" });
    const dj: any = await dr.json().catch(() => ({}));

    (dj.items || []).forEach((v: any) => {
      const title = v.snippet?.title || "Untitled";
      const slug = slugify(title);
      out.push({
        slug,
        title,
        artists: [v.snippet?.channelTitle].filter(Boolean),
        source: "youtube",
        link: `https://www.youtube.com/watch?v=${v.id}`,
        cover:
          v.snippet?.thumbnails?.high?.url ||
          v.snippet?.thumbnails?.default?.url,
        duration: parseISODurationToSeconds(v.contentDetails?.duration),
        tags: ["youtube", "chabad"],
      });
    });

    pageToken = sj.nextPageToken || "";
    if (!pageToken) break;
  }
  return out;
}

// (אופציונלי) Spotify – פרטי מסלול בלבד (אין אודיו ישיר)
async function spotifyToken(): Promise<string | null> {
  if (!SP_ID || !SP_SECRET) return null;
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: SP_ID,
      client_secret: SP_SECRET,
    }),
  });
  const j: any = await r.json().catch(() => ({}));
  return j?.access_token || null;
}
async function spotifyHarvest(query: string, limit: number): Promise<Row[]> {
  const tok = await spotifyToken();
  if (!tok) return [];
  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", String(Math.min(limit, 50)));
  url.searchParams.set("market", "IL");
  const r = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
  const j: any = await r.json().catch(() => ({}));
  const items = j?.tracks?.items || [];
  return items.map(
    (t: any): Row => ({
      slug: slugify(t.name),
      title: t.name,
      artists: (t.artists || []).map((a: any) => a?.name).filter(Boolean),
      source: "spotify",
      link:
        t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`,
      cover: t.album?.images?.[0]?.url,
      duration: Math.round((t.duration_ms || 0) / 1000),
      tags: ["spotify", "chabad"],
    })
  );
}

async function upsert(rows: Row[]) {
  if (!rows.length)
    return { inserted: 0, modified: 0, upserted: 0, matched: 0 };
  const client = await nigunClientPromise;
  const db = client.db(process.env.MONGODB_DB_NIGUNIM || "maty-nigunim");
  const col = db.collection("nigunim");

  const ops = rows.map((r) => ({
    updateOne: {
      filter: { slug: r.slug },
      update: {
        $set: {
          title: r.title,
          artists: r.artists || [],
          source: r.source,
          videoUrl: r.source === "youtube" ? r.link : undefined,
          externalUrl: r.source === "spotify" ? r.link : undefined,
          cover: r.cover || null,
          duration: r.duration || null,
          tags: r.tags || [],
        },
        $setOnInsert: { createdAt: new Date() },
        $currentDate: { updatedAt: true },
      },
      upsert: true,
    },
  }));

  const res = await col.bulkWrite(ops, { ordered: false });
  return {
    inserted: res.insertedCount || 0,
    modified: res.modifiedCount || 0,
    upserted: res.upsertedCount || 0,
    matched: res.matchedCount || 0,
  };
}

async function main() {
  console.log(
    `🚜 harvest: per=${PER} pages=${PAGES} queries=${QUERIES} yt=${USE_YT} sp=${USE_SP}`
  );
  let total = 0,
    wrote = 0;
  for await (const q of readQueries()) {
    console.log(`\n🔎 "${q}"`);
    const chunks: Row[][] = [];
    if (USE_YT) chunks.push(await youtubeHarvest(q, PER, PAGES));
    if (USE_SP) chunks.push(await spotifyHarvest(q, PER * Math.min(PAGES, 10)));
    const rows = chunks.flat();

    if (!rows.length) {
      console.log("— no results");
      continue;
    }
    total += rows.length;

    const res = await upsert(rows);
    wrote += res.inserted + res.upserted + res.modified;
    console.log(
      `✔ upsert: +${res.inserted + res.upserted} mod=${res.modified} match=${
        res.matched
      }`
    );
  }
  console.log(`\n✅ Done. totalFetched=${total} totalWritten=${wrote}`);
}

main().catch((e) => {
  console.error("❌ harvest failed:", e?.message || e);
  process.exit(1);
});
