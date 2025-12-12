// scripts/fetch-spotify-albums.ts

/**
 * סקריפט חד־פעמי / לפי דרישה:
 * ----------------------------
 * 1. לוקח רשימת **שמות אמנים** (לא IDs).
 * 2. מחפש אותם ב-Spotify דרך search API.
 * 3. עבור כל אמן → מושך אלבומים + טרקים.
 * 4. שומר בקולקציה "songs" במונגו:
 *    - title
 *    - artist
 *    - album
 *    - coverUrl
 *    - extId (מזהה ספוטיפיי)
 *    - slug (ייחודי)
 *    - source = "spotify"
 *
 * הרצה:
 *   npx tsx scripts/fetch-spotify-albums.ts
 */

import "dotenv/config";
import fetch from "node-fetch";
import { getCollection } from "../src/lib/db/mongo";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error(
    "Missing Spotify credentials (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET)",
  );
  process.exit(1);
}

/**
 * כאן אתה שולט אילו אמנים מושכים:
 */
const ARTIST_NAMES: string[] = [
  // חסידי / דתי
  "Avraham Fried",
  "Yaakov Shwekey",
  "MBD",
  "Benny Friedman",
  "Motti Steinmetz",

  // מזרחי דתי
  "Ishai Ribo",
  "Yonatan Razel",
  "Natan Goshen",
  "Hanan Ben Ari",

  // אחר כך תוסיף גם את השם שלך כשיהיה ספוטיפיי רשמי
  // "Maty Gurfinckel",
];

/**
 * יצירת slug ייחודי על בסיס שם שיר + אלבום + id של ה-track
 */
function makeSlug(input: string, trackId: string): string {
  const base = input
    .toString()
    .normalize("NFKD") // מנקים ניקוד
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  const safeBase = base || "track";
  return `${safeBase}-${trackId}`;
}

async function getSpotifyToken() {
  const auth = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Spotify token error:", data);
    throw new Error("Failed to get Spotify token");
  }
  return data.access_token as string;
}

/**
 * חיפוש אמן לפי שם – מחזיר את ה־ID שלו
 */
async function resolveArtistIdByName(
  name: string,
  token: string,
): Promise<string | null> {
  const q = encodeURIComponent(name);
  const url = `https://api.spotify.com/v1/search?q=${q}&type=artist&limit=1`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!res.ok) {
    console.error("Spotify search error for artist", name, "→", data);
    return null;
  }

  const items = data.artists?.items ?? [];
  if (!items.length) {
    console.warn("No artist found for name:", name);
    return null;
  }

  const artist = items[0];
  console.log(
    `Artist "${name}" resolved to "${artist.name}" (id=${artist.id})`,
  );
  return artist.id as string;
}

async function fetchJson(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Spotify API error:", data);
    throw new Error("Spotify API failed");
  }
  return data;
}

async function run() {
  const token = await getSpotifyToken();
  console.log("Spotify Token OK");

  const col = await getCollection("songs");

  for (const artistName of ARTIST_NAMES) {
    console.log("======================================");
    console.log("מחפש אמן:", artistName);

    const artistId = await resolveArtistIdByName(artistName, token);
    if (!artistId) {
      console.warn("דלג – לא נמצא אמן:", artistName);
      continue;
    }

    console.log("Pulling albums for", artistName, "→", artistId);

    const albumsData = await fetchJson(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50`,
      token,
    );

    if (!albumsData.items?.length) {
      console.log("No albums found for", artistName);
      continue;
    }

    for (const album of albumsData.items) {
      const cover = album.images?.[1]?.url || album.images?.[0]?.url || "";

      console.log(`  Album: ${album.name} (${album.id}) – pulling tracks...`);

      const tracksData = await fetchJson(
        `https://api.spotify.com/v1/albums/${album.id}/tracks?limit=50`,
        token,
      );

      if (!tracksData.items?.length) continue;

      for (const track of tracksData.items) {
        const baseForSlug = `${track.name}-${album.name}-${artistName}`;
        const slug = makeSlug(baseForSlug, track.id);

        await col.updateOne(
          { extId: track.id }, // מזהה חיצוני יחיד לכל שיר
          {
            $set: {
              title: track.name,
              artist: track.artists?.[0]?.name || artistName,
              extId: track.id,
              source: "spotify",
              album: album.name,
              coverUrl: cover,
              slug, // ← חדש: תמיד ערך טקסט ייחודי
              isReligious: true,
              isActive: true,
              genres: [],
              updatedAt: new Date().toISOString(),
            },
            $setOnInsert: {
              createdAt: new Date().toISOString(),
            },
          },
          { upsert: true },
        );
      }
    }
  }

  console.log("Done!");
  process.exit(0);
}

run().catch((err) => {
  console.error("SCRIPT ERROR:", err);
  process.exit(1);
});
