// // src/components/checkout/CheckoutSDKClient.tsx
// "use client";
// import { PayPalButtons } from "@paypal/react-paypal-js";

// export default function CheckoutSDKClient({ orderId, amountILS }:{
//   orderId: string; amountILS: number;
// }) {
//   return (
//     <main className="max-w-md mx-auto p-6 text-center">
//       <h1 className="text-2xl font-bold mb-3">תשלום</h1>
//       <p className="mb-6">סכום לתשלום: {amountILS.toFixed(2)} ₪</p>
//       <PayPalButtons
//         style={{ layout: "vertical", shape: "rect", label: "pay" }}
//         createOrder={async () => {
//           const res = await fetch("/api/paypal/create-order", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ orderId, amount: amountILS, description: "תשלום הזמנה – MATY MUSIC" }),
//           });
//           const t = await res.text();
//           if (!res.ok) throw new Error(t);
//           return JSON.parse(t).id;
//         }}
//         onApprove={(data) => {
//           window.location.href = `/checkout/success?token=${encodeURIComponent(data.orderID!)}`;
//         }}
//         onError={(e) => { console.error(e); alert("שגיאה בפתיחת התשלום"); }}
//       />
//     </main>
//   );
// }
