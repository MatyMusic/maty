// src/lib/pdf/dom-to-pdf.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/** יוצר PDF מתוך אלמנט, כולל פיצול לכמה עמודים אם הגובה גדול מ־A4 */
export async function domToPdf(el: HTMLElement, filename = "chords.pdf") {
  // רזולוציה קצת יותר גבוהה לתוצאה חדה
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth; // רוחב התמונה יתאים לרוחב העמוד
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let y = 0;
  // חותכים את התמונה לעמודים אם צריך
  let remaining = imgHeight;
  let srcY = 0;
  const pxPerPt = canvas.height / imgHeight; // יחס המרה: פיקסלים -> נקודות PDF

  while (remaining > 0) {
    const sliceHeightPt = Math.min(pageHeight, remaining);
    const sliceHeightPx = sliceHeightPt * pxPerPt;

    // מוסיפים עמוד רק אם זה לא העמוד הראשון
    if (y > 0) pdf.addPage();

    // מוסיפים את כל התמונה וממקמים כך שרק האזור המתאים יופיע (באמצעות addImage אין clip,
    // לכן נשתמש בטריק: יוצרים Canvas זמני לפרוסה.)
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.round(sliceHeightPx);
    const ctx = pageCanvas.getContext("2d")!;
    ctx.drawImage(
      canvas,
      0,
      srcY,
      canvas.width,
      sliceHeightPx, // מקור
      0,
      0,
      pageCanvas.width,
      pageCanvas.height // יעד
    );
    const pageImg = pageCanvas.toDataURL("image/png");
    pdf.addImage(pageImg, "PNG", 0, 0, imgWidth, sliceHeightPt);

    remaining -= sliceHeightPt;
    srcY += sliceHeightPx;
    y += sliceHeightPt;
  }

  pdf.save(filename);
}
