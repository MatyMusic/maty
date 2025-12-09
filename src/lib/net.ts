// src/lib/net.ts
import fetch, { Response } from "node-fetch";

export type ProbeResult = {
  ok: boolean;
  status?: number;
  contentType?: string | null;
  length?: number | null;
  playable?: boolean;
};

const AUDIO_CT_PREFIXES = ["audio/", "application/ogg", "application/flac"];

function looksLikeAudioContentType(ct?: string | null) {
  if (!ct) return false;
  const s = ct.toLowerCase();
  return AUDIO_CT_PREFIXES.some((p) => s.startsWith(p));
}

export async function headOk(
  url: string,
  headers: Record<string, string> = {},
): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers,
    });
    if (res.ok) return res;
    // חלק מהשרתים חוסמים HEAD — ננסה GET קטן
    if ([403, 405, 501].includes(res.status)) return null;
    return null;
  } catch {
    return null;
  }
}

/**
 * בודק אם ניתן לנגן (לפחות בייטים ראשונים), בלי להוריד את כל הקובץ.
 * 1) HEAD — לבדוק content-type/length
 * 2) GET עם Range: bytes=0-1 — לבדוק שגם זה עובד
 */
export async function probeAudioUrl(
  url: string,
  headers: Record<string, string> = {},
): Promise<ProbeResult> {
  // 1) HEAD
  const h = await headOk(url, headers);
  if (h) {
    const ct = h.headers.get("content-type");
    const len = Number(h.headers.get("content-length") || "") || null;
    if (looksLikeAudioContentType(ct)) {
      return {
        ok: true,
        status: h.status,
        contentType: ct,
        length: len,
        playable: true,
      };
    }
  }
  // 2) Range GET 0-1
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1", ...headers },
      redirect: "follow",
    });
    const ct = res.headers.get("content-type");
    if (res.ok && (looksLikeAudioContentType(ct) || res.status === 206)) {
      return {
        ok: true,
        status: res.status,
        contentType: ct,
        length: null,
        playable: true,
      };
    }
    return {
      ok: false,
      status: res.status,
      contentType: ct,
      length: null,
      playable: false,
    };
  } catch {
    return { ok: false, playable: false };
  }
}

/** בדיקת oEmbed ליוטיוב — אם מחזיר JSON תקין, אפשר להטמיע */
export async function youtubeOEmbedOk(watchUrl: string): Promise<boolean> {
  const oembed =
    "https://www.youtube.com/oembed?format=json&url=" +
    encodeURIComponent(watchUrl);
  try {
    const res = await fetch(oembed, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

/** בדיקת oEmbed לסאונדקלאוד */
export async function soundcloudOEmbedOk(pageUrl: string): Promise<boolean> {
  const oembed =
    "https://soundcloud.com/oembed?format=json&url=" +
    encodeURIComponent(pageUrl);
  try {
    const res = await fetch(oembed, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
