// "use client";

// import PaymentMethods from "@/components/payments/PaymentMethods";

// export default function CheckoutClient({
//   orderId,
//   amountILS,
// }: {
//   orderId: string;
//   amountILS: number;
// }) {
//   return (
//     <main className="max-w-md mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-4">תשלום</h1>
//       <p className="mb-6">סכום לתשלום: {amountILS.toFixed(2)} ₪</p>

//       <PaymentMethods
//         orderId={orderId}
//         amountILS={amountILS}
//         description="מקדמה להופעה – MATY MUSIC"
//         onPayPalSuccess={async (captureId: string) => {
//           const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()}`;
//           const customer = { name: "שם הלקוח", email: "customer@example.com" };

//           // 1) הפקת חשבונית PDF
//           const pdfRes = await fetch("/api/invoices/issue", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               invoiceNumber,
//               orderId,
//               captureId,
//               customer,
//               items: [{ title: "מקדמה להופעה", qty: 1, unitPrice: amountILS }],
//               currency: "₪",
//               issuedAt: new Date().toISOString(),
//               business: {
//                 name: "MATY MUSIC",
//                 phone: "054-770-0019",
//                 email: "mtyg7702@gmail.com",
//                 website: "https://maty-music.example",
//                 address: "ישראל",
//                 vatId: "",
//               },
//               notes: "תודה על התשלום! להתראות בהופעה 🎵",
//             }),
//           });
//           if (!pdfRes.ok) {
//             alert("נכשל בהפקת חשבונית");
//             return;
//           }

//           // המרה ל-Base64 עבור שליחה במייל
//           const pdfBlob = await pdfRes.blob();
//           const pdfArray = new Uint8Array(await pdfBlob.arrayBuffer());
//           let binary = "";
//           for (let b of pdfArray) binary += String.fromCharCode(b);
//           const pdfBase64 = btoa(binary);

//           // 2) שמירת הזמנה ב-DB
//           await fetch("/api/orders/record", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               orderId,
//               amountILS,
//               description: "מקדמה להופעה – MATY MUSIC",
//               customer,
//               captureId,
//               paypalRaw: null,
//               invoiceNumber,
//             }),
//           });

//           // 3) שליחת החשבונית במייל
//           await fetch("/api/invoices/email", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               to: customer.email,
//               subject: `חשבונית ${invoiceNumber} – MATY MUSIC`,
//               html: `<p>שלום ${customer.name},</p><p>מצורפת חשבונית על התשלום. תודה!</p>`,
//               pdfBufferBase64: pdfBase64,
//               filename: `${invoiceNumber}.pdf`,
//             }),
//           });

//           // 4) פתיחת ה-PDF ללקוח (אופציונלי)
//           const url = URL.createObjectURL(pdfBlob);
//           window.open(url, "_blank");

//           // 5) מעבר לדף הצלחה
//           window.location.href = "/checkout/success";
//         }}
//         onPayPalError={(e: any) => {
//           console.error(e);
//           alert("שגיאה בתשלום PayPal");
//         }}
//       />
//     </main>
//   );
// }
