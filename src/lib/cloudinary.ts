// src/lib/cloudinary.ts
import "server-only";

/**
 * קובץ Cloudinary בטוח ל-Next 15:
 * - טעינה עצלה בצד השרת בלבד (Node.js)
 * - export default תואם (proxy) כדי לא לשבור importים קיימים
 * - פונקציות עזר להעלאת Buffer ובניית URL
 */

type CloudV2 = typeof import("cloudinary").v2;

let _instance: CloudV2 | null = null;

function assertNodeRuntime() {
  // Cloudinary לא נתמך ב-Edge. נזרוק שגיאה ברורה אם מנסים.
  const isEdge = typeof (globalThis as any).EdgeRuntime !== "undefined";
  if (isEdge) {
    throw new Error(
      '[cloudinary] This module must run on the Node.js runtime (set `export const runtime = "nodejs"` in your route).',
    );
  }
}

export function getCloudinary(): CloudV2 {
  if (_instance) return _instance;

  assertNodeRuntime();

  // טעינה דינמית רק בשרת כדי לא לזהם bundle לקוח
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { v2 } = require("cloudinary") as typeof import("cloudinary");

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn(
      "[cloudinary] Missing envs: CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET",
    );
  }

  v2.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  _instance = v2;
  return v2;
}

/**
 * העלאת תמונה מ-Buffer (למשל קובץ שנשלח מפורם-דאטה)
 * ברירת מחדל: אווטארים ל-MATY-DATE (כמו שהיה אצלך קודם).
 * מחזיר את האובייקט המלא של Cloudinary (secure_url, public_id וכו').
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  {
    folder = process.env.CLOUDINARY_FOLDER || "maty-date/avatars",
    publicId,
    format = "jpg",
    width = 512,
    height = 512,
    crop = "fill",
    gravity = "face:auto",
  }: {
    folder?: string;
    publicId?: string;
    format?: "jpg" | "png" | "webp";
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "limit" | "thumb" | "scale";
    gravity?: string;
  } = {},
) {
  const cloud = getCloudinary();

  const opts = {
    folder,
    public_id: publicId,
    resource_type: "image" as const,
    format,
    overwrite: true,
    transformation: [
      { width, height, crop, gravity, quality: "auto" as const },
      { fetch_format: "auto" as const },
    ],
  };

  return await new Promise<import("cloudinary").UploadApiResponse>(
    (resolve, reject) => {
      const stream = cloud.uploader.upload_stream(opts, (err, res) => {
        if (err || !res) return reject(err || new Error("upload_failed"));
        resolve(res);
      });
      stream.end(buffer);
    },
  );
}

/**
 * העלאת תמונה לגלריה של MATY-MUSIC (תיקייה אחרת כברירת מחדל).
 * זה מה שכדאי להשתמש בו ב-API של הגלריה.
 */
export async function uploadGalleryImageBuffer(
  buffer: Buffer,
  opts: {
    folder?: string;
    publicId?: string;
    format?: "jpg" | "png" | "webp";
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "limit" | "thumb" | "scale";
    gravity?: string;
  } = {},
) {
  const folder = opts.folder || "maty-music/gallery";
  return uploadImageBuffer(buffer, { ...opts, folder });
}

/**
 * העלאת וידאו (למשל לקטעי וידאו של הגלריה).
 * שים לב: video ב-Cloudinary זה resource_type שונה.
 */
export async function uploadVideoBuffer(
  buffer: Buffer,
  {
    folder = "maty-music/gallery",
    publicId,
    format = "mp4",
  }: {
    folder?: string;
    publicId?: string;
    format?: "mp4" | "webm";
  } = {},
) {
  const cloud = getCloudinary();

  const opts = {
    folder,
    public_id: publicId,
    resource_type: "video" as const,
    format,
    overwrite: true,
  };

  return await new Promise<import("cloudinary").UploadApiResponse>(
    (resolve, reject) => {
      const stream = cloud.uploader.upload_stream(opts, (err, res) => {
        if (err || !res) return reject(err || new Error("upload_failed"));
        resolve(res);
      });
      stream.end(buffer);
    },
  );
}

/**
 * בניית URL עם טרנספורמציית אווטאר קונסיסטנטית (לרינדור בצד הלקוח).
 * (מתאים כששומרים רק public_id ורוצים URL עם resize קבוע)
 */
export function buildAvatarUrl(
  publicId: string,
  {
    width = 256,
    height = 256,
    crop = "fill",
    gravity = "face:auto",
    format = "jpg",
  }: {
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "limit" | "thumb" | "scale";
    gravity?: string;
    format?: "jpg" | "png" | "webp";
  } = {},
) {
  const cloud = getCloudinary();
  return cloud.url(publicId, {
    secure: true,
    resource_type: "image",
    transformation: [
      { width, height, crop, gravity, quality: "auto" },
      { fetch_format: "auto" },
    ],
    format,
  });
}

/**
 * URL גנרי למידיה (תמונה/וידאו) לפי publicId.
 * שימושי לגלריה אם תבחר לשמור רק public_id.
 */
export function buildMediaUrl(
  publicId: string,
  {
    resourceType = "image",
    format,
  }: {
    resourceType?: "image" | "video";
    format?: "jpg" | "png" | "webp" | "mp4" | "webm";
  } = {},
) {
  const cloud = getCloudinary();
  return cloud.url(publicId, {
    secure: true,
    resource_type: resourceType,
    format,
  });
}

/** בדיקת זמינות קונפיג (לוג/שימושיות) */
export function isCloudinaryConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  return Boolean(
    CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET,
  );
}

/**
 * export default — Proxy ששומר התאמה לקוד קיים:
 * מאפשר לעשות cloudinary.uploader.upload(...) כמו קודם,
 * אבל טוען את האובייקט האמיתי רק בזמן גישה (ובצד השרת בלבד).
 */
const cloudinaryProxy: CloudV2 = new Proxy({} as any, {
  get(_target, prop: keyof CloudV2) {
    const inst = getCloudinary();
    // @ts-expect-error – מיפוי דינמי של properties
    return inst[prop];
  },
});

export default cloudinaryProxy;
