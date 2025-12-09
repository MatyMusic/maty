import PDFDocument from "pdfkit";

export async function buildBookingPDF(data: {
  bookingId: string;
  name: string;
  email: string;
  phone?: string;
  eventDate: string; // YYYY-MM-DD
  amount: number;
  note?: string;
}) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  doc.on("data", (b) => chunks.push(b));
  const done = new Promise<Buffer>((res) =>
    doc.on("end", () => res(Buffer.concat(chunks)))
  );

  // Header
  doc.fontSize(22).text("MATY MUSIC — Order Confirmation", { align: "left" });
  doc.moveDown(0.2);
  doc
    .fontSize(10)
    .fillColor("#555")
    .text("This is an automatic confirmation. Keep it for your records.");

  doc.moveDown();
  doc.fillColor("#111").fontSize(14).text("Summary", { underline: true });
  doc.moveDown(0.3);

  const rows: Array<[string, string]> = [
    ["Booking ID", data.bookingId],
    ["Customer", data.name || "-"],
    ["Email", data.email || "-"],
    ["Phone", data.phone || "-"],
    ["Event Date", data.eventDate],
    ["Amount (₪)", String(data.amount)],
  ];
  rows.forEach(([k, v]) => {
    doc
      .fontSize(12)
      .text(`${k}: `, { continued: true, width: 140 })
      .font("Helvetica-Bold")
      .text(v);
    doc.font("Helvetica").moveDown(0.1);
  });

  if (data.note) {
    doc
      .moveDown()
      .fontSize(12)
      .text("Notes:", { underline: true })
      .moveDown(0.2)
      .text(data.note);
  }

  doc
    .moveDown()
    .fontSize(10)
    .fillColor("#666")
    .text("Thank you for booking with MATY MUSIC.", { align: "left" });

  doc.end();
  return done;
}
