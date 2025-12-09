// src/scripts/harvest-chabad-info-media.ts
import "dotenv/config";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { getNigunimDb } from "@/lib/db-nigunim";
import { probeAudioUrl } from "@/lib/net";

/**
 * סורק עמודי מדיה של chabad.info (media_category) ושואב MP3 אמיתיים.
 * שומר למסד ב-collection: nigun_audio (עם audioUrl תקין).
 *
 * אפשר לעדכן/להרחיב את רשימת הקטגוריות ב-ENV: CI_CATS (מופרד בפסיקים).
 */

const DEFAULT_MEDIA_CATEGORIES = [
  "https://chabad.info/media_category/chabad/",        // ארכיון ניגוני חב״ד
  "https://chabad.info/media_category/limed/",         // ניגונים שהרבי לימד
  "https://chabad.info/media_category/nneimotchabad/"  // נעימות חב״ד ליובאוויטש
];

const START_CATS: string[] = (process.env.CI_CATS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const MEDIA_CATS = START_CATS.length ? START_CATS : DEFAULT_MEDIA_CATEGORIES;

const MAX_PAGES_PER_CAT = Number(process.env.CI_MEDIA_PAGES || 60);
const DELAY_MS = Number(process.env.CI_DELAY || 300);

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// חיפוש כל קישורי פוסטים/פריטים בתוך עמוד מדיה (WordPress)
async function listPostLinks(listUrl: string): Promise<string[]> {
  const res = await fetch(listUrl, { headers: { "User-Agent": "maty-music/harvest-ci-media (+)" } });
  if (!res.ok) return [];
  const html = await res.text();
  const $ = cheerio.load(html);

  const links = new Set<string>();
  // הרבה אתרים מבוססי WP שמים את הכרטיסיות בתוך article/figure וכו'
  $("article a, .entry-title a, .post a, figure a").each((_, a) => {
    const href = $(a).attr("href");
    if (href && href.startsWith("http") && !href.includes("#")) links.add(href);
  });

  return [...links];
}

// חילוץ MP3 וכותרת מתוך דף פוסט/פריט מדיה
function extractFromPost($: cheerio.CheerioAPI) {
  // קישורי mp3 גלויים
  const mp3Candidates = new Set<string>();
  $('a[href$=".mp3"], audio source[src$=".mp3"], audio[src$=".mp3"]').each((_, el) => {
    const href = $(el).attr("href") || $(el).attr("src");
    if (href && href.startsWith("http")) mp3Candidates.add(href);
  });

  // יש הרבה קישורי CDN: media.chabad.info/...mp3
  // ניקוי פרמטרים מיותרים
  const mp3s = [...mp3Candidates].map(u => u.split("?")[0]);

  const title =
    ($("h1").first().text() || $('meta[property="og:title"]').attr("content") || $("title").text() || "")
      .trim()
      .replace(/\s+/g, " ");

  const cover =
    $('meta[property="og:image"]').attr("content") ||
    $("img").first().attr("src") ||
    null;

  // תגיות/קטגוריות
  const tags: string[] = [];
  $('a[rel="tag"], .tagcloud a, a[rel="category tag"]').each((_, el) => {
    const t = $(el).text().trim();
    if (t) tags.push(t);
  });

  return {
    title,
    cover,
    tags: Array.from(new Set(tags)),
    mp3s
  };
}

async function scrapePost(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "maty-music/harvest-ci-media (+)" } });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);
  const data = extractFromPost($);
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
      const links = await listPostLinks(url);
      if (!links.length) {
        console.log(`[INFO] no posts on ${url} — stop cat`);
        break;
      }

      for (const postUrl of links) {
        try {
          const info = await scrapePost(postUrl);
          if (!info) continue;

          for (const audioUrl of info.mp3s) {
            // מאמתים שה־URL באמת מנגן (HEAD/range)
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
              rights: "public", // שמור קרדיט ושמור קישור מקור באתר
              creditedTo: "Chabad.info",
              createdAt: new Date(),
              updatedAt: new Date()
            };

            await col.updateOne(
              { audioUrl }, // מפתח ייחודי – לא נכניס כפילויות
              { $set: doc },
              { upsert: true }
            );

            imported++;
            if (imported % 20 === 0) console.log(`[OK] imported: ${imported}`);
          }
        } catch (e) {
          console.warn("[WARN] post failed:", postUrl, e instanceof Error ? e.message : e);
        }
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
