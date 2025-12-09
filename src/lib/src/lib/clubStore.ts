// src/lib/clubStore.ts
import { promises as fs } from "fs";
import path from "path";

export type Audience = "public" | "community" | "private" | "matchmaker";
export type PostVisibility = "visible" | "hidden";
export type PostStatus = "pending" | "approved" | "rejected";
export type Mode = "post" | "poll" | "audio";

export type ClubPost = {
  id: string;
  createdAt: string;
  authorId: string;
  mode: Mode;
  text: string;
  hashtags: string[];
  videoUrl: string | null;
  images: string[]; // URLs יחסיים ל-public
  audioUrl: string | null; // URL יחסי ל-public
  audience: Audience;
  visibility: PostVisibility;
  scheduleISO: string | null;
  location: { lat: number; lon: number } | null;
  poll: null | {
    question: string;
    options: string[];
    multi: boolean;
    durationHours: number;
  };
  status: PostStatus;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "club-posts.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readPosts(): Promise<ClubPost[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as ClubPost[];
  } catch {
    return [];
  }
}

async function writePosts(posts: ClubPost[]) {
  await ensureDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), "utf8");
}

export function genId(prefix = "cp"): string {
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rnd}`;
}

export async function addPost(p: ClubPost) {
  const posts = await readPosts();
  posts.unshift(p);
  await writePosts(posts);
}

export async function getPost(id: string): Promise<ClubPost | null> {
  const posts = await readPosts();
  return posts.find((x) => x.id === id) || null;
}

export async function updatePost(
  id: string,
  patch: Partial<ClubPost>,
): Promise<ClubPost | null> {
  const posts = await readPosts();
  const i = posts.findIndex((x) => x.id === id);
  if (i === -1) return null;
  posts[i] = { ...posts[i], ...patch };
  await writePosts(posts);
  return posts[i];
}

export type Counts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

export async function getCounts(): Promise<Counts> {
  const posts = await readPosts();
  const counts: Counts = {
    total: posts.length,
    pending: 0,
    approved: 0,
    rejected: 0,
  };
  for (const p of posts) counts[p.status]++;
  return counts;
}
