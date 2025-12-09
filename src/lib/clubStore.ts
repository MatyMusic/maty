// src/lib/clubStore.ts
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/** =========================
 *  Types
 *  ========================= */
export type Audience = "public" | "community" | "private" | "matchmaker";
export type Mode = "post" | "poll" | "audio";
export type PostVisibility = "visible" | "hidden";
export type PostStatus = "pending" | "approved" | "rejected";

export type ClubPost = {
  id: string;
  createdAt: string;
  authorId: string;

  mode: Mode;
  text: string;
  images: string[];
  videoUrl: string | null;
  audioUrl: string | null;

  hashtags: string[];
  scheduleISO: string | null;
  audience: Audience;
  visibility: PostVisibility;
  location: { lat: number; lon: number } | null;

  poll: null | {
    question: string;
    options: string[];
    multi: boolean;
    durationHours: number;
  };

  status: PostStatus; // default: "pending"
};

/** =========================
 *  Paths
 *  ========================= */
const DATA_DIR = path.join(process.cwd(), "data", "club");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

const PUBLIC_UPLOAD = path.join(process.cwd(), "public", "uploads", "club");
const IMG_DIR = path.join(PUBLIC_UPLOAD, "images");
const AUDIO_DIR = path.join(PUBLIC_UPLOAD, "audio");

/** =========================
 *  FS bootstrap
 *  ========================= */
export async function ensureStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });
  await fs.mkdir(AUDIO_DIR, { recursive: true });
  try {
    await fs.access(POSTS_FILE);
  } catch {
    await fs.writeFile(POSTS_FILE, "[]", "utf8");
  }
}

/** =========================
 *  Helpers
 *  ========================= */
export function genId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "id_" + Math.random().toString(16).slice(2);
  }
}

export async function readPosts(): Promise<ClubPost[]> {
  try {
    const raw = await fs.readFile(POSTS_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as ClubPost[]) : [];
  } catch {
    return [];
  }
}

export async function writePosts(arr: ClubPost[]) {
  await fs.writeFile(POSTS_FILE, JSON.stringify(arr, null, 2), "utf8");
}

export async function addPost(p: ClubPost) {
  const arr = await readPosts();
  arr.push(p);
  await writePosts(arr);
}

export async function updatePost(
  id: string,
  patch: Partial<ClubPost>,
): Promise<ClubPost | null> {
  const arr = await readPosts();
  const i = arr.findIndex((x) => x.id === id);
  if (i < 0) return null;
  arr[i] = { ...arr[i], ...patch };
  await writePosts(arr);
  return arr[i];
}

/** =========================
 *  Uploads
 *  ========================= */
function sanitizeBase(name: string) {
  return (name || "")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}
function extFrom(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

export async function saveUpload(
  file: File,
  kind: "images" | "audio",
): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const base = sanitizeBase(
    file.name || (kind === "images" ? "image" : "audio"),
  );
  const ext = extFrom(base) || (kind === "images" ? ".jpg" : ".webm");
  const stamp = Date.now();
  const rnd = Math.random().toString(36).slice(2, 8);
  const fname = `${stamp}_${rnd}${ext}`;
  const dir = kind === "images" ? IMG_DIR : AUDIO_DIR;
  await fs.writeFile(path.join(dir, fname), buf);
  // public URL
  return `/uploads/club/${kind}/${fname}`;
}
