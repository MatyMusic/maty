// scripts/scan-duplicates.mjs
import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.join(process.cwd(), "src", "app");

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (name === "page.tsx" || name === "route.ts") out.push(full);
  }
  return out;
}

function normalizeUrlFromFile(fullPath) {
  // הורד prefix של app
  let rel = fullPath.replace(APP_DIR, "").replace(/\\/g, "/");
  // הורד שם הקובץ
  rel = rel.replace(/\/(page\.tsx|route\.ts)$/, "");
  // מחיקת קבוצות (group) — לא חלק מה-URL
  rel = rel.replace(/\/\([^/]+\)/g, "");
  // המרה של קטעים דינמיים למפתח כללי
  rel = rel.replace(/\[([^\]/]+)\]/g, ":$1");
  // דאבל סלשים → אחד
  rel = rel.replace(/\/+/g, "/");
  // ריק → "/"
  return rel || "/";
}

const files = fs.existsSync(APP_DIR) ? walk(APP_DIR) : [];
const map = new Map();
for (const f of files) {
  const url = normalizeUrlFromFile(f);
  const arr = map.get(url) || [];
  arr.push(f);
  map.set(url, arr);
}

let dupCount = 0;
for (const [url, arr] of map.entries()) {
  if (arr.length > 1) {
    dupCount++;
    console.log(`\n⚠ URL כפול: ${url}`);
    for (const f of arr) {
      console.log("  - " + path.relative(process.cwd(), f));
    }
  }
}

if (dupCount === 0) {
  console.log("✅ לא נמצאו מסלולי URL כפולים.");
} else {
  console.log(`\nסה״כ ${dupCount} מסלולים כפולים — מומלץ לאחד/להסיר כפילויות.`);
  process.exitCode = 1;
}
