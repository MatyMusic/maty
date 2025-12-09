// src/scripts/harvest-ia.ts
import "dotenv/config";
import fetch from "node-fetch";
import { getNigunimDb } from "@/lib/db-nigunim";
import { probeAudioUrl } from "@/lib/net";

/** ===== הגדרות חיפוש ===== */
const BASE_QUERY =
  '(collection:(chabad OR hassidic OR hasidic OR jewish OR nigunim) ' +
  'OR subject:(Chabad OR Hasidic OR Hasidut OR Breslov OR Carlebach OR Shabbat OR nigun OR ניגון OR ניגונים OR זמירות OR jewish OR hassidic)) ' +
  'AND (mediatype:(audio))';

const ROWS = Number(process.env.IA_ROWS || 100);         // כמה פריטים לעמוד
const PAGES = Number(process.env.IA_PAGES || 100);       // כמה עמודים
const SLOWDOWN_MS = Number(process.env.IA_DELAY || 250); // השהייה כדי לא להיחסם

function isAudioName(n: string) {
  const s = n.toLowerCase();
  return s.endsWith(".mp3") || s.endsWith(".flac") || s.endsWith(".ogg") || s.endsWith(".wav");
}
function formatPrio(name: string) {
  const s = name.toLowerCase();
  if (s.endsWith(".mp3")) return 1;
  if (s.endsWith(".flac")) return 2;
  if (s.endsWith(".ogg")) return 3;
  return 4;
}
async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (PAGES <= 0) {
    console.log("[WARN] IA_PAGES=0 — לא ירוץ. קבע IA_PAGES=40..100 או עדכן בקוד.");
    process.exit(0);
  }

  const db = await getNigunimDb();
  const col = db.collection("nigun_audio");
  let imported = 0;

  for (let page = 1; page <= PAGES; page++) {
    const searchUrl =
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(BASE_QUERY)}` +
      `&fl[]=identifier,title,creator,year&rows=${ROWS}&page=${page}&output=json`;
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "maty-music/harvest-ia (+https://maty.music)" },
    });
    if (!res.ok) {
      console.error(`[ERR] IA search HTTP ${res.status} page=${page}`);
      await sleep(1000);
      continue;
    }

    const json = await res.json().catch(() => null);
    const items: Array<{ identifier: string; title?: string; creator?: string; year?: string }> =
      json?.response?.docs || [];
    if (!items.length) {
      console.log(`[INFO] no more results at page ${page}, stopping.`);
      break;
    }

    for (const it of items) {
      try {
        const metaUrl = `https://archive.org/metadata/${it.identifier}`;
        const mres = await fetch(metaUrl);
        if (!mres.ok) continue;

        const meta = await mres.json().catch(() => null);
        const files: any[] = meta?.files || [];
        if (!files.length) continue;

        const audioFiles = files.filter((f) => f?.name && isAudioName(String(f.name)));
        if (!audioFiles.length) continue;

        audioFiles.sort((a, b) => formatPrio(String(a.name)) - formatPrio(String(b.name)));

        let chosenUrl: string | null = null;
        for (const f of audioFiles) {
          const url = `https://archive.org/download/${it.identifier}/${encodeURIComponent(String(f.name))}`;
          const probe = await probeAudioUrl(url);
          if (probe?.ok && probe?.playable) {
            chosenUrl = url;
            break;
          }
        }
        if (!chosenUrl) continue;

        const title =
          String(it.title || meta?.metadata?.title || it.identifier || "").trim() || it.identifier;
        const artist = String(it.creator || meta?.metadata?.creator || "Unknown").trim();
        const year = String(it.year || meta?.metadata?.date || "").trim() || null;
        const pageUrl = `https://archive.org/details/${it.identifier}`;

        let coverUrl: string | null = null;
        const img = files.find((f) => String(f.name).toLowerCase().match(/\.(jpg|jpeg|png)$/));
        if (img?.name) {
          coverUrl = `https://archive.org/download/${it.identifier}/${encodeURIComponent(String(img.name))}`;
        }

        const doc = {
          title,
          album: meta?.metadata?.album || null,
          artist,
          year,
          tags: ["jewish", "chasidic", "nigun"],
          origin: "internet-archive",
          audioUrl: chosenUrl,
          format: chosenUrl.split(".").pop()?.toLowerCase() || null,
          coverUrl,
          sourceItemUrl: pageUrl,
          rights: "public",
          creditedTo: artist || "Internet Archive",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await col.updateOne(
          { title: doc.title, artist: doc.artist, sourceItemUrl: doc.sourceItemUrl },
          { $set: doc },
          { upsert: true }
        );

        imported++;
        if (imported % 25 === 0) console.log(`[OK] Imported ${imported} tracks so far`);
      } catch (e) {
        console.warn("[WARN] item failed:", it?.identifier, e instanceof Error ? e.message : e);
      }
    }

    console.log(`[OK] Page ${page} done. Total imported: ${imported}`);
    await sleep(SLOWDOWN_MS);
  }

  console.log(`[DONE] Imported working audio: ${imported}`);
}

main().catch((e) => {
  console.error("[FATAL] harvest-ia:", e);
  process.exit(1);
});
