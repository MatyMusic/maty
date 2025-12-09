// scripts/backfill-covers.ts
/**
 * Backfill covers for nigunim that are missing a `cover` field.
 *
 * - Uses Puppeteer to render the same kind of nice cover (gradient + title + optional waveform)
 * - Tries to decode waveform from Cloudinary `audioUrl` (CORS-permitting). Falls back to no-waveform if blocked.
 * - Uploads the PNG to Cloudinary (unsigned preset) and updates Mongo.
 *
 * Usage:
 *   tsx -r dotenv/config -r tsconfig-paths/register scripts/backfill-covers.ts --limit 200
 *   tsx -r dotenv/config -r tsconfig-paths/register scripts/backfill-covers.ts --dry
 */
import "dotenv/config";
import puppeteer from "puppeteer";
import nigunClientPromise from "@/lib/mongo-nigunim";

const CLOUD =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME;
const PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
  process.env.CLOUDINARY_UPLOAD_PRESET;

if (!CLOUD || !PRESET) {
  console.error("❌ Missing Cloudinary env: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");
  process.exit(1);
}

const IMG_UPLOAD = `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`;

function parseArgs() {
  const args = process.argv.slice(2);
  const out: any = { limit: 200, dry: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--limit") out.limit = Number(args[++i] || 0) || 200;
    else if (a === "--dry") out.dry = true;
  }
  return out;
}

function slugify(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0590-\u05FF]/g, (m) => m) // keep Hebrew
    .trim()
    .toLowerCase()
    .replace(/[\s\p{S}\p{P}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uploadDataUrl(dataUrl: string, publicId?: string) {
  const body = new FormData();
  body.append("file", dataUrl);
  body.append("upload_preset", PRESET as string);
  if (publicId) body.append("public_id", publicId);
  const res = await fetch(IMG_UPLOAD, { method: "POST", body });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error?.message || "cloudinary_upload_failed");
  return j.secure_url as string;
}

async function main() {
  const { limit, dry } = parseArgs();
  const client = await nigunClientPromise;
  const db = client.db(process.env.MONGODB_DB_NIGUNIM || "maty-nigunim");
  const col = db.collection("nigunim");

  // find missing covers first
  const cur = col
    .find(
      {
        $or: [{ cover: { $exists: false } }, { cover: null }, { cover: "" }],
      },
      { projection: { _id: 1, title: 1, slug: 1, audioUrl: 1 } }
    )
    .limit(limit);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Prepare the rendering function inside the page once
  await page.evaluateOnNewDocument(() => {
    (window as any).__renderCover = async function renderCoverArt(opts: {
      title: string;
      subtitle?: string;
      audioUrl?: string | null;
      size?: number;
      rtl?: boolean;
    }): Promise<string> {
      const { title, subtitle, audioUrl, size = 1000, rtl = true } = opts;

      function hashHues(s: string): [number, number] {
        let h1 = 0, h2 = 0;
        for (let i = 0; i < s.length; i++) {
          h1 = (h1 * 31 + s.charCodeAt(i)) % 360;
          h2 = (h2 * 17 + s.charCodeAt(i) * 3) % 360;
        }
        if (Math.abs(h1 - h2) < 30) h2 = (h2 + 60) % 360;
        return [h1, h2];
      }
      function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
      }
      function fillWrapped(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
        const words = (text || "").split(/\s+/);
        let line = "";
        let cy = y;
        for (let i = 0; i < words.length; i++) {
          const test = (line ? line + " " : "") + words[i];
          const w = ctx.measureText(test).width;
          if (w > maxW && line) {
            ctx.fillText(line, x, cy);
            line = words[i];
            cy += lineH;
          } else {
            line = test;
          }
        }
        if (line) ctx.fillText(line, x, cy);
      }
      async function tryWaveformFromUrl(url: string): Promise<number[] | null> {
        try {
          const res = await fetch(url, { mode: "cors" });
          const buf = await res.arrayBuffer();
          const AudioCtx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          const decoded = await ctx.decodeAudioData(buf.slice(0));
          ctx.close?.();
          const ch0 = decoded.getChannelData(0);
          const ch1 = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : null;
          const mono = new Float32Array(ch0.length);
          for (let i = 0; i < ch0.length; i++) mono[i] = ch1 ? (ch0[i] + ch1[i]) / 2 : ch0[i];
          // downsample to 72 bars
          const bars = 72;
          const len = mono.length;
          const size = Math.floor(len / bars) || 1;
          const resPeaks: number[] = [];
          for (let b = 0; b < bars; b++) {
            const start = b * size;
            let peak = 0;
            for (let i = 0; i < size && start + i < len; i++) {
              const v = Math.abs(mono[start + i]);
              if (v > peak) peak = v;
            }
            resPeaks.push(Math.max(0, Math.min(1, peak)));
          }
          return resPeaks;
        } catch {
          return null;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      const [h1, h2] = hashHues(title || "nigun");
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, `hsl(${h1} 80% 60%)`);
      grad.addColorStop(1, `hsl(${h2} 80% 50%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      const pad = Math.round(size * 0.06);
      const cardR = Math.round(size * 0.04);
      roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, cardR);
      ctx.fill();

      // try waveform
      let peaks: number[] | null = null;
      if (audioUrl) peaks = await tryWaveformFromUrl(audioUrl).catch(() => null);

      if (peaks && peaks.length) {
        const bars = peaks.length;
        const w = size - pad * 2;
        const h = Math.round(size * 0.28);
        const x0 = pad;
        const y0 = size - pad - h - Math.round(size * 0.08);
        const gap = Math.max(1, Math.floor(w / (bars * 3)));
        const barW = Math.max(2, Math.floor((w - gap * (bars - 1)) / bars));
        for (let i = 0; i < bars; i++) {
          const v = peaks[i];
          const bh = Math.max(2, Math.floor(v * h));
          const x = x0 + i * (barW + gap);
          const y = y0 + Math.floor((h - bh) / 2);
          const g = ctx.createLinearGradient(0, y, 0, y + bh);
          g.addColorStop(0, "rgba(255,255,255,0.95)");
          g.addColorStop(1, "rgba(255,255,255,0.55)");
          ctx.fillStyle = g;
          roundRect(ctx, x, y, barW, bh, Math.min(6, Math.floor(barW / 2)));
          ctx.fill();
        }
      }

      ctx.save();
      if (rtl) (ctx as any).direction = "rtl";
      ctx.textAlign = rtl ? "right" : "left";
      ctx.textBaseline = "alphabetic";
      const titleSize = Math.round(size * 0.08);
      const subSize = Math.round(size * 0.038);
      ctx.fillStyle = "#0b0b0b";
      ctx.font = `600 ${titleSize}px system-ui, -apple-system, Segoe UI, "Heebo", Arial`;
      const tx = rtl ? size - pad * 1.3 : pad * 1.3;
      const ty = pad * 2.4 + titleSize;
      fillWrapped(ctx, title, tx, ty, size - pad * 2.6, titleSize * 1.2);
      if (subtitle) {
        (ctx as any).globalAlpha = 0.8;
        ctx.font = `500 ${subSize}px system-ui, -apple-system, Segoe UI, "Heebo", Arial`;
        fillWrapped(ctx, subtitle, tx, ty + titleSize * 1.2 + subSize * 1.2, size - pad * 2.6, subSize * 1.15);
      }
      ctx.restore();

      return canvas.toDataURL("image/png", 0.92);
    };
  });

  let ok = 0, fail = 0, total = 0;
  while (await cur.hasNext()) {
    const doc: any = await cur.next();
    if (!doc) break;
    total++;
    const title: string = (doc.title || doc.slug || "ניגון");
    const slug: string = (doc.slug || slugify(title));
    const audioUrl: string | undefined = doc.audioUrl || undefined;

    process.stdout.write(`🎨 ${slug} ... `);

    try {
      const dataUrl: string = await page.evaluate(
        (title, audioUrl) => (window as any).__renderCover({ title, audioUrl, subtitle: "MATY MUSIC", size: 1000, rtl: true }),
        title,
        audioUrl || null
      );

      if (!dataUrl?.startsWith("data:image/png")) throw new Error("data_url_failed");
      if (dry) {
        console.log("DRY");
        ok++;
        continue;
      }

      const coverUrl = await uploadDataUrl(dataUrl, `${slug}-cover`);
      const res = await col.updateOne(
        { _id: doc._id },
        { $set: { cover: coverUrl, updatedAt: new Date() } }
      );
      console.log(`OK ${coverUrl ? "✅" : ""}`);
      ok++;
    } catch (e: any) {
      console.log("FAIL:", e?.message || e);
      fail++;
    }
  }

  await browser.close();
  console.log(`\nDone. total=${total} ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error("❌ backfill failed:", e?.message || e);
  process.exit(1);
});
