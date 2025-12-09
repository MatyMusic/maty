// // src/app/checkout/CheckoutHybridClient.tsx
// "use client";

// import { useState } from "react";
// import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

// export default function CheckoutHybridClient({
//   orderId,
//   amountILS,
// }: {
//   orderId: string;
//   amountILS: number;
// }) {
//   const [{ loadingStatus }] = usePayPalScriptReducer() as any;
//   const [redirecting, setRedirecting] = useState(false);

//   async function redirectPay() {
//     try {
//       setRedirecting(true);
//       const res = await fetch("/api/paypal/create-order", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           orderId,
//           amount: amountILS,
//           description: "תשלום הזמנה – MATY MUSIC",
//         }),
//       });
//       const data = await res.json();
//       if (!res.ok || !data?.approveUrl) {
//         throw new Error(data?.error?.message || "create-order failed");
//       }
//       window.location.href = data.approveUrl;
//     } catch (e: any) {
//       console.error(e);
//       alert("שגיאה בפתיחת PayPal: " + (e?.message || e));
//     } finally {
//       setRedirecting(false);
//     }
//   }

//   return (
//     <main className="max-w-md mx-auto p-6 text-center">
//       <h1 className="text-2xl font-bold mb-3">תשלום</h1>
//       <p className="mb-6">סכום לתשלום: {amountILS.toFixed(2)} ₪</p>

//       {loadingStatus === "resolved" ? (
//         <PayPalButtons
//           style={{ layout: "vertical", shape: "rect", label: "pay" }}
//           createOrder={async (): Promise<string> => {
//             const res = await fetch("/api/paypal/create-order", {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 orderId,
//                 amount: amountILS,
//                 description: "תשלום הזמנה – MATY MUSIC",
//               }),
//             });
//             const txt = await res.text();
//             if (!res.ok) throw new Error(txt);
//             return JSON.parse(txt).id as string; // ← מזה מחזירים PayPal Order ID
//           }}
//           onApprove={(data: any /* , actions?: any */): void => {
//             const token = (data?.orderID ?? "") as string; // ייתכן undefined → מחסנים
//             if (!token) {
//               alert("חסר orderID מה-PayPal");
//               return;
//             }
//             window.location.href = `/checkout/success?token=${encodeURIComponent(token)}`;
//           }}
//           onError={(e: any): void => {
//             console.error("PayPal onError", e);
//             // פולבק אוטומטי ל-Redirect
//             redirectPay();
//           }}
//         />
//       ) : (
//         <button
//           onClick={redirectPay}
//           className="btn bg-brand text-white border-0 hover:opacity-90"
//           disabled={redirecting}
//         >
//           {redirecting ? "פותח..." : "שלם עם PayPal"}
//         </button>
//       )}
//     </main>
//   );
// }



"use client";

import { useState } from "react";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

export default function CheckoutHybridClient({
  orderId, amountILS,
}: { orderId: string; amountILS: number; }) {
  const [{ loadingStatus }] = usePayPalScriptReducer() as any;
  const [redirecting, setRedirecting] = useState(false);

  async function redirectPay() {
    try {
      setRedirecting(true);
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount: amountILS, description: "תשלום הזמנה – MATY MUSIC" }),
      });
      const data = await res.json();
      if (!res.ok || !data?.approveUrl) throw new Error(data?.error?.message || "create-order failed");
      window.location.href = data.approveUrl;
    } catch (e:any) { console.error(e); alert("שגיאה בפתיחת PayPal: " + (e?.message || e)); }
    finally { setRedirecting(false); }
  }

  return (
    <main className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-3">תשלום</h1>
      <p className="mb-6">סכום לתשלום: {amountILS.toFixed(2)} ₪</p>

      {loadingStatus === "resolved" ? (
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", label: "pay" }}
          createOrder={async (): Promise<string> => {
            const res = await fetch("/api/paypal/create-order", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId, amount: amountILS, description: "תשלום הזמנה – MATY MUSIC" }),
            });
            const txt = await res.text();
            if (!res.ok) throw new Error(txt);
            return JSON.parse(txt).id as string;
          }}
          onApprove={(data:any): void => {
            const token = data?.orderID as string;
            if (!token) { alert("חסר orderID מה-PayPal"); return; }
            window.location.href = `/checkout/success?token=${encodeURIComponent(token)}`;
          }}
          onError={() => redirectPay()} // אם ה-SDK נופל – פולבק ל-Redirect
        />
      ) : (
        <button className="btn bg-brand text-white border-0 hover:opacity-90"
                onClick={redirectPay} disabled={redirecting}>
          {redirecting ? "פותח..." : "שלם עם PayPal"}
        </button>
      )}
    </main>
  );
}
