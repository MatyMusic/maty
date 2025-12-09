// scripts/backfill-covers-lite.ts
import "dotenv/config";
// אם יש בעיית alias, החלף לשורה הבאה:
// import nigunClientPromise from "../src/lib/mongo-nigunim";
import nigunClientPromise from "@/lib/mongo-nigunim";

const CLOUD =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME;
const PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
  process.env.CLOUDINARY_UPLOAD_PRESET;
const FOLDER = process.env.CLOUDINARY_FOLDER || ""; // אופציונלי

if (!CLOUD || !PRESET) {
  console.error("❌ Missing Cloudinary env (CLOUD / PRESET).");
  process.exit(1);
}

type Theme = "classic" | "neon" | "gold";
function arg<T = string>(name: string, def?: T) {
  const i = process.argv.indexOf(name);
  if (i === -1) return def as any;
  const v = process.argv[i + 1];
  return (v as any) ?? def;
}
const LIMIT = Number(arg("--limit", 200));
const DRY = process.argv.includes("--dry");
const THEME = (arg("--theme", "classic") as Theme) || "classic";
const BADGE = (arg("--badge", "") as string) || "";

function hashHues(s: string): [number, number] {
  let h1 = 0,
    h2 = 0;
  for (let i = 0; i < s.length; i++) {
    h1 = (h1 * 31 + s.charCodeAt(i)) % 360;
    h2 = (h2 * 17 + s.charCodeAt(i) * 3) % 360;
  }
  if (Math.abs(h1 - h2) < 30) h2 = (h2 + 60) % 360;
  return [h1, h2];
}
function themeColors(theme: Theme, seed: string) {
  const [h1, h2] = hashHues(seed || "nigun");
  if (theme === "neon")
    return [
      `hsl(${(h1 + 40) % 360},95%,55%)`,
      `hsl(${(h2 + 320) % 360},95%,50%)`,
    ];
  if (theme === "gold") return ["#E6C061", "#C89B3C"];
  return [`hsl(${h1},80%,60%)`, `hsl(${h2},80%,50%)`];
}
function escXml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function buildSvg(
  title: string,
  subtitle = "MATY MUSIC",
  theme: Theme,
  badge?: string
) {
  const size = 1000;
  const [c1, c2] = themeColors(theme, title);
  const t = escXml(title);
  const sub = escXml(subtitle);
  const b = badge ? escXml(badge) : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur in="SourceGraphic" stdDeviation="2"/></filter>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" fill="url(#g)"/>
  <rect x="60" y="60" width="${size - 120}" height="${
    size - 120
  }" rx="40" fill="rgba(255,255,255,0.18)"/>
  <g opacity="0.35">
    <rect x="60" y="60" width="${size - 120}" height="${Math.round(
    (size - 120) * 0.34
  )}" rx="18" fill="white" filter="url(#soft)"/>
  </g>
  <g style="direction: rtl; unicode-bidi: bidi-override">
    <text x="${
      size - 90
    }" y="320" text-anchor="end" font-family="Heebo, Arial, sans-serif" font-weight="700" font-size="86" fill="#0b0b0b">${t}</text>
    <text x="${
      size - 90
    }" y="380" text-anchor="end" font-family="Heebo, Arial, sans-serif" font-weight="500" font-size="40" fill="#222" opacity="0.85">${sub}</text>
  </g>
  ${
    b
      ? `<g style="direction: rtl; unicode-bidi: bidi-override">
    <rect x="${
      size - 90 - 420
    }" y="170" width="420" height="60" rx="30" fill="rgba(255,255,255,0.4)"/>
    <text x="${
      size - 90 - 210
    }" y="210" text-anchor="middle" font-family="Heebo, Arial, sans-serif" font-weight="600" font-size="36" fill="#111">${b}</text>
  </g>`
      : ""
  }
</svg>`;
}
function dataUrlFromSvg(svg: string) {
  const base64 = Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/** שליחה ב־x-www-form-urlencoded (עוקף FormData) */
async function uploadSvgToCloudinary(svg: string, publicId?: string) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`;
  const file = dataUrlFromSvg(svg);
  const params = new URLSearchParams();
  params.set("file", file);
  params.set("upload_preset", PRESET!);
  if (publicId)
    params.set("public_id", FOLDER ? `${FOLDER}/${publicId}` : publicId);
  if (FOLDER && !publicId) params.set("folder", FOLDER);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      j?.error?.message || JSON.stringify(j) || `status ${res.status}`;
    throw new Error(`cloudinary_upload_failed: ${msg}`);
  }
  return (j.secure_url as string) || (j.url as string);
}

function derivePublicIdFromUrl(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx === -1) return null;
    const after = parts.slice(idx + 1);
    const withFolder = after.join("/");
    const noVer = withFolder.replace(/^v\d+\//, "");
    return noVer.replace(/\.[^.]+$/, "") || null;
  } catch {
    return null;
  }
}
function cloudSampleUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD}/video/upload/du_30/${publicId}.mp3`;
}

async function main() {
  console.log(
    `🎨 Backfill-lite covers: limit=${LIMIT} theme=${THEME} dry=${DRY}`
  );
  const client = await nigunClientPromise;
  const db = client.db(process.env.MONGODB_DB_NIGUNIM || "maty-nigunim");
  const col = db.collection("nigunim");

  const cur = col
    .find(
      { $or: [{ cover: { $exists: false } }, { cover: null }, { cover: "" }] },
      {
        projection: {
          _id: 1,
          title: 1,
          slug: 1,
          audioUrl: 1,
          cloudinaryId: 1,
          bpm: 1,
          mood: 1,
          tempo: 1,
        },
      }
    )
    .limit(LIMIT);

  let ok = 0,
    fail = 0,
    total = 0;
  while (await cur.hasNext()) {
    const doc: any = await cur.next();
    if (!doc) break;
    total++;

    const title = (doc.title || doc.slug || "ניגון") as string;
    const slug = (doc.slug || title).toString();
    let cloudinaryId: string | null =
      doc.cloudinaryId || derivePublicIdFromUrl(doc.audioUrl);

    const badgeParts: string[] = [];
    if (typeof doc.bpm === "number") badgeParts.push(`BPM ${doc.bpm}`);
    if (doc.tempo) badgeParts.push(String(doc.tempo));
    if (doc.mood) badgeParts.push(String(doc.mood));
    const badge = BADGE || (badgeParts.length ? badgeParts.join(" • ") : "");

    process.stdout.write(`• ${slug} ... `);
    try {
      const svg = buildSvg(title, "MATY MUSIC", THEME, badge);

      let coverUrl: string | null = null;
      if (!DRY) {
        try {
          coverUrl = await uploadSvgToCloudinary(svg, `${slug}-cover`);
        } catch (e: any) {
          // לוג מלא – שתראה למה נפל
          console.log(`CLOUDINARY FAIL: ${e?.message || e}`);
        }
      }

      const $set: any = { updatedAt: new Date() };
      if (coverUrl) {
        $set.cover = coverUrl;
      } else {
        // FallBack: נשמור כ-data URL כדי שה-UI יעבוד מיידית
        $set.cover = dataUrlFromSvg(svg);
      }
      if (cloudinaryId) {
        $set.cloudinaryId = cloudinaryId;
        $set.sampleUrl = cloudSampleUrl(cloudinaryId);
      }

      if (!DRY) await col.updateOne({ _id: doc._id }, { $set });
      console.log(coverUrl ? "OK" : "OK[data-url]");
      ok++;
    } catch (e: any) {
      console.log("FAIL:", e?.message || e);
      fail++;
    }
  }

  console.log(`\nDone. total=${total} ok=${ok} fail=${fail}`);
}

main().catch((e) => {
  console.error("❌ backfill-lite failed:", e?.message || e);
  process.exit(1);
});
