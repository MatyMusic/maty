// src/scripts/harvest-chabad-info-media.ts
import "dotenv/config";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { getNigunimDb } from "../lib/db-nigunim";
import { probeAudioUrl } from "../lib/net";

/**
 * סורק *קטגוריות מדיה* של chabad.info (לא חדשות) ומאתר MP3 אמיתיים.
 * כתיבה ל-collection: nigun_audio (עם audioUrl תקין).
 * דגש על שימוש זיכרון נמוך: מעבד כל פוסט ומיד "זורק" אותו.
 */

const DEFAULT_MEDIA_CATEGORIES = [
  "https://chabad.info/media_category/chabad/",       // ארכיון ניגוני חב״ד
  "https://chabad.info/media_category/limed/",        // ניגונים שהרבי לימד
  "https://chabad.info/media_category/nneimotchabad/" // נעימות חב״ד ליובאוויטש
];

const START_CATS = (process.env.CI_CATS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const MEDIA_CATS = START_CATS.length ? START_CATS : DEFAULT_MEDIA_CATEGORIES;

const MAX_PAGES_PER_CAT = Number(process.env.CI_MEDIA_PAGES || 40);
const DELAY_MS = Number(process.env.CI_DELAY || 250);
const PER_PAGE_CONCURRENCY = Number(process.env.CI_CONCURRENCY || 3); // לא להגזים

const UA = { "User-Agent": "maty-music/harvest-ci-media (+)" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function normalizeUrl(u?: string | null) {
  if (!u) return null;
  const x = u.split("#")[0].split("?")[0];
  if (x.startsWith("//")) return "https:" + x;
  return x;
}

async function listPostLinks(listUrl: string): Promise<string[]> {
  const res = await fetch(listUrl, { headers: UA });
  if (!res.ok) return [];
  const html = await res.text();
  const $ = cheerio.load(html);
  const links = new Set<string>();

  $("article a, .entry-title a, .post a, figure a").each((_, a) => {
    const href = $(a).attr("href");
    if (href && href.startsWith("http")) links.add(href.split("#")[0]);
  });

  // שחרור זיכרון
  ($ as any).root?.();
  return [...links];
}

function extractFromPost(html: string) {
  const $ = cheerio.load(html);

  // MP3 ישירים
  const mp3s = new Set<string>();
  $('a[href$=".mp3"], audio source[src$=".mp3"], audio[src$=".mp3"]').each((_, el) => {
    const href = ($(el).attr("href") || $(el).attr("src") || "").trim();
    const n = normalizeUrl(href);
    if (n && n.startsWith("http")) mp3s.add(n);
  });

  // כותרת/עטיפה/תגיות
  const title =
    ($("h1").first().text() ||
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "").trim().replace(/\s+/g, " ");

  const cover =
    $('meta[property="og:image"]').attr("content") ||
    $("img").first().attr("src") ||
    null;

  const tags: string[] = [];
  $('a[rel="tag"], .tagcloud a, a[rel="category tag"]').each((_, el) => {
    const t = $(el).text().trim();
    if (t) tags.push(t);
  });

  // שחרור זיכרון
  ($ as any).root?.();
  return { title, cover: normalizeUrl(cover), tags: Array.from(new Set(tags)), mp3s: [...mp3s] };
}

async function scrapePost(url: string) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return null;
  const html = await res.text();
  const data = extractFromPost(html);
  if (!data.mp3s.length) return null;
  return {
    title: data.title || url,
    coverUrl: data.cover || null,
    tags: data.tags,
    pageUrl: url,
    mp3s: data.mp3s
  };
}

async function main() {
  const db = await getNigunimDb();
  const col = db.collection("nigun_audio");
  let imported = 0;

  for (const base of MEDIA_CATS) {
    console.log(`[CAT] ${base}`);

    for (let p = 1; p <= MAX_PAGES_PER_CAT; p++) {
      const url = p === 1 ? base : `${base.replace(/\/$/, "")}/page/${p}/`;
      let links: string[] = [];
      try {
        links = await listPostLinks(url);
      } catch (e: any) {
        console.warn("[WARN] listPostLinks failed:", url, e?.message || e);
      }
      if (!links.length) {
        console.log(`[INFO] no posts on ${url} — stop cat`);
        break;
      }

      // עיבוד במנות קטנות כדי לא לנפח זיכרון
      for (let i = 0; i < links.length; i += PER_PAGE_CONCURRENCY) {
        const chunk = links.slice(i, i + PER_PAGE_CONCURRENCY);

        await Promise.all(
          chunk.map(async (postUrl) => {
            try {
              const info = await scrapePost(postUrl);
              if (!info) return;

              for (const raw of info.mp3s) {
                const audioUrl = normalizeUrl(raw);
                if (!audioUrl) continue;

                // ודא שניתן לנגן
                const probe = await probeAudioUrl(audioUrl);
                if (!probe?.ok || !probe?.playable) continue;

                const doc = {
                  title: info.title,
                  album: null,
                  artist: "Chabad.info",
                  year: null,
                  tags: ["chabad", "nigun", "chasidic", ...info.tags].filter(Boolean),
                  origin: "chabad.info",
                  audioUrl,
                  format: audioUrl.split(".").pop()?.toLowerCase() || "mp3",
                  coverUrl: info.coverUrl,
                  sourceItemUrl: info.pageUrl,
                  rights: "public",
                  creditedTo: "Chabad.info",
                  createdAt: new Date(),
                  updatedAt: new Date()
                };

                await col.updateOne({ audioUrl }, { $set: doc }, { upsert: true });

                imported++;
                if (imported % 20 === 0) console.log(`[OK] imported: ${imported}`);
              }
            } catch (e: any) {
              console.warn("[WARN] post failed:", postUrl, e?.message || e);
            }
          })
        );

        // עזרה ל-GC
        await sleep(10);
        // @ts-ignore
        global.gc && global.gc();
      }

      console.log(`[OK] page ${p} done. total so far: ${imported}`);
      await sleep(DELAY_MS);
    }
  }

  console.log(`[DONE] chabad.info media imported: ${imported}`);
}

main().catch((e) => {
  console.error("[FATAL] harvest-chabad-info-media:", e);
  process.exit(1);
});
