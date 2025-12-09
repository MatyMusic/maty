// // src/lib/booking-pdf.ts
// // PDF בעברית + RTL עם pdf-lib
// import { PDFDocument, rgb } from "pdf-lib";
// import fontkit from "@pdf-lib/fontkit";
// import fs from "node:fs/promises";
// import path from "node:path";

// export type BookingForPdf = {
//   id: string;
//   name?: string;
//   email?: string;
//   phone?: string;
//   eventDate?: string; // YYYY-MM-DD
//   amount: number;
//   note?: string;
//   createdAt?: string | Date;
// };

// const BRAND = { r: 108 / 255, g: 92 / 255, b: 231 / 255 }; // #6C5CE7
// const BRAND_LIGHT = { r: 246 / 255, g: 240 / 255, b: 255 / 255 }; // רקע פס עליון
// const GRAY = rgb(0.1, 0.1, 0.1); // צבע מטיפוס rgb()

// function ltr(s: string) {
//   // שומר טקסט לועזי שמאלה גם בתוך RTL
//   return `\u200E${s}\u200E`;
// }

// async function readPublic(p: string) {
//   const full = path.join(process.cwd(), "public", p);
//   return fs.readFile(full);
// }

// function fmtILS(n?: number) {
//   try {
//     return new Intl.NumberFormat("he-IL", {
//       style: "currency",
//       currency: "ILS",
//       maximumFractionDigits: 0,
//     }).format(n ?? 0);
//   } catch {
//     return `${n ?? 0} ₪`;
//   }
// }

// function fmtDate(d?: string) {
//   if (!d) return "—";
//   const dt = new Date(d);
//   return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("he-IL");
// }

// type DrawTextOpts = {
//   xRight: number;
//   y: number;
//   size?: number;
//   font: any;
//   color?: ReturnType<typeof rgb>;
// };

// // טקסט מיושר לימין (RTL)
// function drawRTL(page: any, text: string | undefined, opts: DrawTextOpts) {
//   const { xRight, y, size = 12, font, color = GRAY } = opts;
//   const t = (text ?? "—").toString();
//   const w = font.widthOfTextAtSize(t, size);
//   page.drawText(t, { x: xRight - w, y, size, font, color });
// }

// export async function buildBookingPdfBuffer(b: BookingForPdf) {
//   const pdf = await PDFDocument.create();
//   pdf.registerFontkit(fontkit);

//   // פונטים (Noto Sans Hebrew תחת public/fonts)
//   const regBytes = await readPublic("fonts/NotoSansHebrew-Regular.ttf");
//   const boldBytes = await readPublic("fonts/NotoSansHebrew-Bold.ttf");
//   const fontReg = await pdf.embedFont(regBytes, { subset: true });
//   const fontBold = await pdf.embedFont(boldBytes, { subset: true });

//   // עמוד A4
//   const page = pdf.addPage([595.28, 841.89]);
//   const { width, height } = page.getSize();
//   const margin = 40;
//   const contentLeft = margin;
//   const contentRight = width - margin;

//   // פס עליון
//   const headerH = 86;
//   page.drawRectangle({
//     x: 0,
//     y: height - headerH,
//     width,
//     height: headerH,
//     color: rgb(BRAND_LIGHT.r, BRAND_LIGHT.g, BRAND_LIGHT.b),
//   });

//   // לוגו (public/logo-email.png אם קיים; אחרת icon-192.png)
//   try {
//     let logoBytes: Buffer | null = null;
//     try {
//       logoBytes = await readPublic("logo-email.png");
//     } catch {
//       logoBytes = await readPublic("icon-192.png");
//     }
//     if (logoBytes) {
//       const png = await pdf.embedPng(logoBytes);
//       const L = 64;
//       page.drawImage(png, {
//         x: contentRight - L,
//         y: height - headerH + (headerH - L) / 2,
//         width: L,
//         height: L,
//         opacity: 0.95,
//       });
//     }
//   } catch {
//     /* no logo – fine */
//   }

//   // ===== כותרת מפוצלת: עברית | " — " | אנגלית (ללא היפוך) =====
//   const titleHe = "אישור הזמנה";
//   const titleEn = "MATY MUSIC";
//   const dash = " — ";
//   const T = 22;

//   const xRightTitle = contentRight - 70; // משאיר מקום ללוגו
//   const yTitle = height - headerH / 2 - T / 2 + 6;

//   const wHe = fontBold.widthOfTextAtSize(titleHe, T);
//   const wDash = fontBold.widthOfTextAtSize(dash, T);
//   const wEn = fontBold.widthOfTextAtSize(titleEn, T);
//   const titleColor = rgb(BRAND.r, BRAND.g, BRAND.b);

//   // עברית (ימין)
//   drawRTL(page, titleHe, {
//     xRight: xRightTitle,
//     y: yTitle,
//     size: T,
//     font: fontBold,
//     color: titleColor,
//   });
//   // מקף באמצע
//   page.drawText(dash, {
//     x: xRightTitle - wHe - wDash,
//     y: yTitle,
//     size: T,
//     font: fontBold,
//     color: titleColor,
//   });
//   // אנגלית (LTR)
//   page.drawText(titleEn, {
//     x: xRightTitle - wHe - wDash - wEn,
//     y: yTitle,
//     size: T,
//     font: fontBold,
//     color: titleColor,
//   });

//   // חותמת זמן
//   const ts = b.createdAt
//     ? new Date(b.createdAt).toLocaleString("he-IL")
//     : new Date().toLocaleString("he-IL");
//   page.drawText(ts, {
//     x: contentLeft,
//     y: height - headerH + 12,
//     size: 10,
//     font: fontReg,
//     color: rgb(0.45, 0.45, 0.5),
//   });

//   // קופסת פרטים
//   const boxTop = height - headerH - 24;
//   const boxH = 360;
//   page.drawRectangle({
//     x: contentLeft,
//     y: boxTop - boxH,
//     width: contentRight - contentLeft,
//     height: boxH,
//     borderColor: rgb(BRAND.r, BRAND.g, BRAND.b),
//     borderWidth: 1,
//     borderDashArray: [3, 3],
//     color: rgb(1, 1, 1),
//     opacity: 0.95,
//   });

//   // שורות פרטים
//   const pad = 18;
//   const labelRight = contentRight - pad - 6;
//   const valueRight = labelRight - 220;
//   let y = boxTop - pad - 6;
//   const rowH = 28;

//   const rows: Array<{ label: string; value: string }> = [
//     { label: "שם הלקוח", value: b.name || "—" },
//     { label: "אימייל", value: b.email || "—" },
//     { label: "טלפון", value: b.phone || "—" },
//     { label: "תאריך האירוע", value: fmtDate(b.eventDate) },
//     { label: "סכום", value: fmtILS(b.amount) },
//     { label: "מזהה הזמנה", value: b.id || "—" },
//   ];

//   for (const row of rows) {
//     // נקודת מותג
//     page.drawCircle({
//       x: contentRight - pad,
//       y: y + 8,
//       size: 3.5,
//       color: rgb(BRAND.r, BRAND.g, BRAND.b),
//     });

//     // תווית
//     drawRTL(page, row.label, {
//       xRight: labelRight,
//       y,
//       size: 12.5,
//       font: fontBold,
//       color: GRAY,
//     });

//     // ערך (שומר LTR אם לועזי)
//     const val = /^[\x00-\x7F]+$/.test(row.value) ? ltr(row.value) : row.value;
//     drawRTL(page, val, {
//       xRight: valueRight,
//       y,
//       size: 12,
//       font: fontReg,
//       color: rgb(0.12, 0.12, 0.14),
//     });

//     y -= rowH;
//   }

//   // הערות
//   if (b.note) {
//     y -= 8;
//     drawRTL(page, "הערות", {
//       xRight: labelRight,
//       y,
//       size: 12.5,
//       font: fontBold,
//       color: GRAY,
//     });
//     y -= 18;
//     for (const ln of b.note.split(/\r?\n/).slice(0, 6)) {
//       drawRTL(page, ln.trim(), {
//         xRight: labelRight,
//         y,
//         size: 11.5,
//         font: fontReg,
//         color: rgb(0.22, 0.22, 0.25),
//       });
//       y -= 18;
//     }
//   }

//   // פס תחתון
//   page.drawRectangle({
//     x: margin,
//     y: margin + 22,
//     width: width - margin * 2,
//     height: 1.2,
//     color: rgb(BRAND.r, BRAND.g, BRAND.b),
//     opacity: 0.35,
//   });

//   // פוטר — "שירות לקוחות — maty-music.com" ללא היפוך
//   {
//     const S = 10;
//     const color = rgb(BRAND.r * 0.9, BRAND.g * 0.9, BRAND.b * 0.9);
//     const xRight = contentRight;
//     const yFooter = margin + 8;

//     const he = "שירות לקוחות";
//     const dash = " — ";
//     const en = "maty-music.com";

//     const wHe = fontReg.widthOfTextAtSize(he, S);
//     const wDash = fontReg.widthOfTextAtSize(dash, S);
//     const wEn = fontReg.widthOfTextAtSize(en, S);

//     drawRTL(page, he, { xRight, y: yFooter, size: S, font: fontReg, color });
//     page.drawText(dash, {
//       x: xRight - wHe - wDash,
//       y: yFooter,
//       size: S,
//       font: fontReg,
//       color,
//     });
//     page.drawText(en, {
//       x: xRight - wHe - wDash - wEn,
//       y: yFooter,
//       size: S,
//       font: fontReg,
//       color,
//     });
//   }

//   const bytes = await pdf.save();
//   return Buffer.from(bytes);
// }

// PDF בעברית + RTL עם pdf-lib
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";

export type BookingForPdf = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  eventDate?: string; // YYYY-MM-DD
  amount: number;
  note?: string;
  createdAt?: string | Date;
};

const BRAND = { r: 108 / 255, g: 92 / 255, b: 231 / 255 }; // #6C5CE7
const BRAND_LIGHT = { r: 246 / 255, g: 240 / 255, b: 255 / 255 }; // רקע פס עליון
const GRAY = rgb(0.1, 0.1, 0.1); // צבע מטיפוס rgb()

function ltr(s: string) {
  return `\u200E${s}\u200E`;
}

async function readPublic(p: string) {
  const full = path.join(process.cwd(), "public", p);
  return fs.readFile(full);
}

function fmtILS(n?: number) {
  try {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(n ?? 0);
  } catch {
    return `${n ?? 0} ₪`;
  }
}

function fmtDate(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("he-IL");
}

type DrawTextOpts = {
  xRight: number;
  y: number;
  size?: number;
  font: any;
  color?: ReturnType<typeof rgb>;
};
function drawRTL(page: any, text: string | undefined, opts: DrawTextOpts) {
  const { xRight, y, size = 12, font, color = GRAY } = opts;
  const t = (text ?? "—").toString();
  const w = font.widthOfTextAtSize(t, size);
  page.drawText(t, { x: xRight - w, y, size, font, color });
}

export async function buildBookingPdfBuffer(b: BookingForPdf) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  // פונטים (Noto Sans Hebrew תחת public/fonts)
  const regBytes = await readPublic("fonts/NotoSansHebrew-Regular.ttf");
  const boldBytes = await readPublic("fonts/NotoSansHebrew-Bold.ttf");
  const fontReg = await pdf.embedFont(regBytes, { subset: true });
  const fontBold = await pdf.embedFont(boldBytes, { subset: true });

  // עמוד A4
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 40;
  const contentLeft = margin;
  const contentRight = width - margin;

  // פס עליון
  const headerH = 86;
  page.drawRectangle({
    x: 0,
    y: height - headerH,
    width,
    height: headerH,
    color: rgb(BRAND_LIGHT.r, BRAND_LIGHT.g, BRAND_LIGHT.b),
  });

  // לוגו (public/logo-email.png אם קיים; אחרת icon-192.png)
  try {
    let logoBytes: Buffer | null = null;
    try {
      logoBytes = await readPublic("logo-email.png");
    } catch {
      logoBytes = await readPublic("icon-192.png");
    }
    if (logoBytes) {
      const png = await pdf.embedPng(logoBytes);
      const L = 64;
      page.drawImage(png, {
        x: contentRight - L,
        y: height - headerH + (headerH - L) / 2,
        width: L,
        height: L,
        opacity: 0.95,
      });
    }
  } catch {}

  // כותרת עברית/אנגלית
  const titleHe = "אישור הזמנה";
  const titleEn = "MATY MUSIC";
  const dash = " — ";
  const T = 22;
  const xRightTitle = contentRight - 70; // מקום ללוגו
  const yTitle = height - headerH / 2 - T / 2 + 6;
  const wHe = fontBold.widthOfTextAtSize(titleHe, T);
  const wDash = fontBold.widthOfTextAtSize(dash, T);
  const wEn = fontBold.widthOfTextAtSize(titleEn, T);
  const titleColor = rgb(BRAND.r, BRAND.g, BRAND.b);

  drawRTL(page, titleHe, {
    xRight: xRightTitle,
    y: yTitle,
    size: T,
    font: fontBold,
    color: titleColor,
  });
  page.drawText(dash, {
    x: xRightTitle - wHe - wDash,
    y: yTitle,
    size: T,
    font: fontBold,
    color: titleColor,
  });
  page.drawText(titleEn, {
    x: xRightTitle - wHe - wDash - wEn,
    y: yTitle,
    size: T,
    font: fontBold,
    color: titleColor,
  });

  // זמן
  const ts = b.createdAt
    ? new Date(b.createdAt).toLocaleString("he-IL")
    : new Date().toLocaleString("he-IL");
  page.drawText(ts, {
    x: contentLeft,
    y: height - headerH + 12,
    size: 10,
    font: fontReg,
    color: rgb(0.45, 0.45, 0.5),
  });

  // קופסת פרטים
  const boxTop = height - headerH - 24;
  const boxH = 360;
  page.drawRectangle({
    x: contentLeft,
    y: boxTop - boxH,
    width: contentRight - contentLeft,
    height: boxH,
    borderColor: rgb(BRAND.r, BRAND.g, BRAND.b),
    borderWidth: 1,
    borderDashArray: [3, 3],
    color: rgb(1, 1, 1),
    opacity: 0.95,
  });

  // שורות פרטים
  const pad = 18;
  const labelRight = contentRight - pad - 6;
  const valueRight = labelRight - 220;
  let y = boxTop - pad - 6;
  const rowH = 28;

  const rows: Array<{ label: string; value: string }> = [
    { label: "שם הלקוח", value: b.name || "—" },
    { label: "אימייל", value: b.email || "—" },
    { label: "טלפון", value: b.phone || "—" },
    { label: "תאריך האירוע", value: fmtDate(b.eventDate) },
    { label: "סכום", value: fmtILS(b.amount) },
    { label: "מזהה הזמנה", value: b.id || "—" },
  ];

  for (const row of rows) {
    page.drawCircle({
      x: contentRight - pad,
      y: y + 8,
      size: 3.5,
      color: rgb(BRAND.r, BRAND.g, BRAND.b),
    });
    drawRTL(page, row.label, {
      xRight: labelRight,
      y,
      size: 12.5,
      font: fontBold,
      color: GRAY,
    });
    const val = /^[\x00-\x7F]+$/.test(row.value) ? ltr(row.value) : row.value;
    drawRTL(page, val, {
      xRight: valueRight,
      y,
      size: 12,
      font: fontReg,
      color: rgb(0.12, 0.12, 0.14),
    });
    y -= rowH;
  }

  if (b.note) {
    y -= 8;
    drawRTL(page, "הערות", {
      xRight: labelRight,
      y,
      size: 12.5,
      font: fontBold,
      color: GRAY,
    });
    y -= 18;
    for (const ln of b.note.split(/\r?\n/).slice(0, 6)) {
      drawRTL(page, ln.trim(), {
        xRight: labelRight,
        y,
        size: 11.5,
        font: fontReg,
        color: rgb(0.22, 0.22, 0.25),
      });
      y -= 18;
    }
  }

  // פס תחתון + פוטר
  page.drawRectangle({
    x: margin,
    y: margin + 22,
    width: width - margin * 2,
    height: 1.2,
    color: rgb(BRAND.r, BRAND.g, BRAND.b),
    opacity: 0.35,
  });
  const S = 10;
  const color = rgb(BRAND.r * 0.9, BRAND.g * 0.9, BRAND.b * 0.9);
  const xRight = contentRight;
  const yFooter = margin + 8;
  const he = "שירות לקוחות";
  const dash2 = " — ";
  const en = "maty-music.com";
  const wHe2 = fontReg.widthOfTextAtSize(he, S);
  const wDash2 = fontReg.widthOfTextAtSize(dash2, S);
  const wEn2 = fontReg.widthOfTextAtSize(en, S);
  drawRTL(page, he, { xRight, y: yFooter, size: S, font: fontReg, color });
  page.drawText(dash2, {
    x: xRight - wHe2 - wDash2,
    y: yFooter,
    size: S,
    font: fontReg,
    color,
  });
  page.drawText(en, {
    x: xRight - wHe2 - wDash2 - wEn2,
    y: yFooter,
    size: S,
    font: fontReg,
    color,
  });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
