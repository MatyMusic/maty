// src/lib/date-avatars.ts
export type Gender = "male" | "female" | "other" | null | undefined;

/**
 * מחזיר data URI של SVG מעוגל עם סילואט מגדרי.
 * צבעים עדינים (בהירים במצב Light וכהים במצב Dark דרך אופסיטי).
 */
export function getDefaultDateAvatar(
  opts: { gender: Gender } = { gender: "other" }
) {
  const g = opts.gender || "other";

  // גוונים עדינים: אפשר לשנות לפי המיתוג שלך
  const palettes = {
    male: { bg: "#4f46e5", fg: "#ffffff" }, // אינדיגו
    female: { bg: "#db2777", fg: "#ffffff" }, // פוקסיה/ורוד
    other: { bg: "#7c3aed", fg: "#ffffff" }, // ויולט
  } as const;

  const { bg, fg } =
    g === "male"
      ? palettes.male
      : g === "female"
      ? palettes.female
      : palettes.other;

  // SVG עגול 256x256 עם סילואט פשוט
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="avatar">
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0.75"/>
      </linearGradient>
      <clipPath id="clipCircle">
        <circle cx="128" cy="128" r="124"/>
      </clipPath>
    </defs>
    <rect width="256" height="256" rx="128" fill="url(#grad)"/>
    <g clip-path="url(#clipCircle)">
      ${
        g === "female"
          ? `
          <!-- סילואט נשי -->
          <circle cx="128" cy="96" r="44" fill="${fg}" />
          <path d="M44 220c8-40 44-64 84-64s76 24 84 64" fill="${fg}" />
        `
          : g === "male"
          ? `
          <!-- סילואט גברי -->
          <circle cx="128" cy="96" r="44" fill="${fg}" />
          <rect x="76" y="140" width="104" height="70" rx="24" fill="${fg}" />
        `
          : `
          <!-- סילואט נייטרלי -->
          <circle cx="128" cy="96" r="40" fill="${fg}" />
          <path d="M64 214c12-36 52-58 64-58s52 22 64 58" fill="${fg}" />
        `
      }
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * בוחר URL סופי להצגה:
 * 1) אם יש avatarUrl אמיתי — משתמשים בו
 * 2) אחרת — מחזירים data URI מגדרי
 */
export function resolveDateAvatar(
  avatarUrl: string | null | undefined,
  gender: Gender
) {
  if (avatarUrl && typeof avatarUrl === "string") return avatarUrl;
  return getDefaultDateAvatar({ gender });
}
