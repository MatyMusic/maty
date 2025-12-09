// "use client";

// import * as React from "react";
// import { useEffect, useMemo, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// /**
//  * MATY-DATE — Upgrade Page (4 Tiers)
//  * מסלולים: FREE / PLUS / PRO / VIP
//  * מחירים חודשיים: 0 / 49 / 89 / 130 (₪)
//  * מחירים שנתיים: 0 / 490 / 890 / 1300 (₪) — ניתן לשנות כאן בקלות
//  *
//  * UX:
//  * - קריאת פרמטרים (feature|src|to|demo)
//  * - קלפי תמחור 4 מסלולים עם יתרונות מפורטים
//  * - הדגשות שיווקיות: וידאו, אווטארים מדברים, תמונות/סרטונים ועוד
//  * - בחירת VIP אוטומטית אם feature=video
//  * - קופון דמו (LOVE/SIMCHA)
//  * - Sticky summary + מודאל תשלום/דמו
//  * - RTL + Dark + Tailwind
//  *
//  * חיבור סליקה אמיתי:
//  * - החלף handlePay() בקריאה לשרת / ספק סליקה והפניה ל-redirect URL.
//  */

// type Feature = "chat" | "video" | "superlike" | "wink";
// type Tier = "free" | "plus" | "pro" | "vip";

// const ALL_PERKS = {
//   chat: "פתיחת צ׳אט",
//   video: "שיחת וידאו",
//   superlike: "סופר־לייק",
//   wink: "קריצה",
// };

// const INCLUDED: Record<Tier, string[]> = {
//   free: [
//     "גלישה בסיסית בפרופילים",
//     "לייקים מוגבלים ביום",
//     "שימוש בסיסי בפילטרים",
//     "טיזר וידאו/אווטארים (תצוגת דמו)",
//   ],
//   plus: [
//     "צ׳אט פתוח עם התאמות הדדיות",
//     "תמונות/סרטונים באיכות רגילה",
//     "פילוחים שימושיים + סינון קהילה/עיר",
//     "סופר־לייק ×1 ביום",
//   ],
//   pro: [
//     "צ׳אט פתוח ללא הגבלה",
//     "וידאו איכותי + אווטארים מדברים",
//     "סופר־לייק ×3 ביום",
//     "סינון מתקדם + פילוח ערכים",
//     "תמיכה בעדיפות רגילה",
//   ],
//   vip: [
//     "כל יכולות PRO +",
//     "וידאו פרימיום 1080p + Boost שבועי",
//     "סופר־לייק ללא מגבלה סבירה",
//     "שידוך ידני (צוות/שדכנית)",
//     "תמיכה בעדיפות גבוהה",
//   ],
// };

// const PRICE: Record<Tier, { monthly: number; yearly: number }> = {
//   free: { monthly: 0, yearly: 0 },
//   plus: { monthly: 49, yearly: 490 },
//   pro: { monthly: 89, yearly: 890 },
//   vip: { monthly: 130, yearly: 1300 }, // VIP = 130 ₪
// };

// function shekel(n: number) {
//   return new Intl.NumberFormat("he-IL", {
//     style: "currency",
//     currency: "ILS",
//     maximumFractionDigits: 0,
//   }).format(n);
// }

// function cx(...c: Array<string | false | null | undefined>) {
//   return c.filter(Boolean).join(" ");
// }

// export default function UpgradePage() {
//   const sp = useSearchParams();
//   const router = useRouter();

//   // פרמטרים נכנסים
//   const feature = (sp.get("feature") || "chat") as Feature;
//   const src = sp.get("src") || "matches";
//   const to = sp.get("to") || null;
//   const initialDemo = sp.get("demo") === "1";

//   // שליטת UI
//   const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
//   const [chosen, setChosen] = useState<Tier>("pro");
//   const [demo, setDemo] = useState(initialDemo);
//   const [coupon, setCoupon] = useState("");
//   const [couponOk, setCouponOk] = useState<null | {
//     code: string;
//     off: number;
//   }>(null);

//   // מודאל תשלום
//   const [payOpen, setPayOpen] = useState(false);
//   const [paying, setPaying] = useState(false);
//   const [payErr, setPayErr] = useState<string | null>(null);

//   // VIP אוטומטי כשמגיעים לוידאו
//   useEffect(() => {
//     if (feature === "video") setChosen("vip");
//   }, [feature]);

//   // שמירת בחירה לאחרונים
//   useEffect(() => {
//     try {
//       localStorage.setItem(
//         "matydate:last-upgrade",
//         JSON.stringify({ chosen, cycle, feature, demo }),
//       );
//     } catch {}
//   }, [chosen, cycle, feature, demo]);

//   // מחיר
//   const priceRaw = PRICE[chosen][cycle];
//   const discount = couponOk ? Math.round(priceRaw * couponOk.off) : 0;
//   const price = Math.max(0, priceRaw - discount);

//   function tryCoupon() {
//     const code = (coupon || "").trim().toUpperCase();
//     if (!code) return setCouponOk(null);
//     if (code === "LOVE") setCouponOk({ code, off: 0.25 });
//     else if (code === "SIMCHA") setCouponOk({ code, off: 0.15 });
//     else setCouponOk(null);
//   }

//   // טקסטים לפי פיצ׳ר
//   const featTitle =
//     feature === "chat"
//       ? "צ׳אט"
//       : feature === "video"
//         ? "וידאו"
//         : ALL_PERKS[feature] || "שדרוג";
//   const heroLine = `שדרוג כדי לפתוח ${featTitle} + אווטארים מדברים, תמונות/סרטונים ויכולות חכמות`;

//   // יתרונות ממוקדים
//   const focusPerks = useMemo(() => {
//     const f = feature;
//     const base = [
//       f === "chat" && "פתיחת שיחות צ׳אט חופשיות",
//       f === "video" && "שיחות וידאו + אווטארים מדברים",
//       f === "superlike" && "סופר־לייק בולט ומושך תשומת לב",
//       f === "wink" && "קריצה חמימה לשבירת הקרח",
//     ].filter(Boolean) as string[];
//     const extra =
//       chosen === "vip"
//         ? ["Boost חשיפה שבועי", "שידוך ידני (צוות/שדכנית)"]
//         : chosen === "pro"
//           ? ["סינון מתקדם + פילוח ערכים", "תמיכה בעדיפות רגילה"]
//           : chosen === "plus"
//             ? ["פילוחים שימושיים", "סופר־לייק ×1 ביום"]
//             : ["הצצה ליכולות (דמו)"];
//     return [...base, ...extra];
//   }, [feature, chosen]);

//   function onContinue() {
//     // FREE אינו דורש תשלום — “הפעל עכשיו” פשוט מפנה חזרה
//     if (chosen === "free") {
//       const back =
//         src === "profile"
//           ? "/date/profile"
//           : src === "matches"
//             ? "/date/matches"
//             : "/date/matches";
//       router.push(back + "?free=1");
//       return;
//     }
//     setPayOpen(true);
//   }

//   // “תשלום” דמו/אמיתי
//   async function handlePay() {
//     setPayErr(null);
//     setPaying(true);
//     try {
//       // TODO: החלף בקריאת סליקה אמיתית
//       await new Promise((r) => setTimeout(r, 900));

//       try {
//         localStorage.setItem(
//           "matydate:last-receipt",
//           JSON.stringify({
//             at: Date.now(),
//             tier: chosen,
//             cycle,
//             price,
//             src,
//             feature,
//             to,
//             coupon: couponOk?.code || null,
//           }),
//         );
//       } catch {}
//       setPayOpen(false);

//       // הפניה חזרה ליעד
//       if (to && feature === "chat") {
//         router.push(`/date/chat/${encodeURIComponent(to)}?welcome=1`);
//       } else if (to && feature === "video") {
//         router.push(`/date/video?to=${encodeURIComponent(to)}&welcome=1`);
//       } else {
//         const back =
//           src === "profile"
//             ? "/date/profile"
//             : src === "matches"
//               ? "/date/matches"
//               : "/date/matches";
//         router.push(back + "?upgraded=1");
//       }
//     } catch (e: any) {
//       setPayErr(e?.message || "שגיאת תשלום");
//     } finally {
//       setPaying(false);
//     }
//   }

//   return (
//     <div className="min-h-dvh bg-gradient-to-b from-transparent to-violet-950/5 dark:to-black/20">
//       <style
//         dangerouslySetInnerHTML={{
//           __html: `
//           .blink-soft { animation: blinkSoft 2.1s ease-in-out infinite }
//           @keyframes blinkSoft { 0%,100%{ filter:none } 50%{ filter:brightness(1.06) saturate(1.06) } }
//           .glow { box-shadow: 0 10px 30px rgba(124,58,237,.22) }
//           .card-fx { transition: transform .15s ease, box-shadow .2s ease; }
//           .card-fx:hover { transform: translateY(-2px); }
//           .vip-ribbon { position:absolute; inset-inline-end: -40px; inset-block-start: 14px; transform: rotate(35deg); background:#f59e0b; color:#111; padding: 2px 46px; font-weight:700; font-size:12px; box-shadow:0 6px 18px rgba(0,0,0,.2); }
//         `,
//         }}
//       />
//       <main className="mx-auto max-w-6xl px-4 py-10" dir="rtl">
//         {/* HERO */}
//         <header className="grid gap-6 md:grid-cols-[1.25fr,.75fr] md:items-center">
//           <div>
//             <div className="mm-badge mm-badge-brand inline-flex items-center gap-1 blink-soft">
//               🚀 שדרוג חשבון · {src === "profile" ? "פרופיל" : "התאמות"}
//             </div>
//             <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
//               {heroLine}
//             </h1>
//             <p className="mt-2 opacity-80 leading-7">
//               מסלולי <b>FREE</b>, <b>PLUS</b>, <b>PRO</b> ו־<b>VIP</b> — יוציאו
//               ממך את המקסימום: צ׳אט, וידאו, אווטארים מדברים, סופר־לייק, פילוחים
//               חכמים, Boost שבועי (VIP) ועוד.
//             </p>

//             {/* מחזור חיוב */}
//             <div className="mt-4 inline-flex rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 overflow-hidden">
//               <button
//                 className={cx(
//                   "h-10 px-4 text-sm font-semibold",
//                   cycle === "monthly" && "bg-black/5 dark:bg-white/10",
//                 )}
//                 onClick={() => setCycle("monthly")}
//               >
//                 חודשי
//               </button>
//               <button
//                 className={cx(
//                   "h-10 px-4 text-sm font-semibold",
//                   cycle === "yearly" && "bg-black/5 dark:bg-white/10",
//                 )}
//                 onClick={() => setCycle("yearly")}
//                 title="שנה — במחיר מוזל"
//               >
//                 שנתי (חיסכון)
//               </button>
//             </div>

//             {/* יתרונות ממוקדים */}
//             <ul className="mt-4 grid gap-1 text-sm opacity-85">
//               {focusPerks.map((p) => (
//                 <li key={p}>• {p}</li>
//               ))}
//             </ul>
//           </div>

//           {/* סיכום קצר */}
//           <aside className="mm-card p-4 card-fx">
//             <div className="text-sm opacity-70">מסלול נבחר</div>
//             <div className="mt-1 text-2xl font-extrabold">
//               {chosen.toUpperCase()} ·{" "}
//               <span className="text-brand">
//                 {shekel(price)}
//                 <span className="text-sm opacity-70">
//                   /{cycle === "monthly" ? "חודש" : "שנה"}
//                 </span>
//               </span>
//             </div>
//             {!!discount && (
//               <div className="text-xs opacity-75">
//                 לפני הנחה: <s>{shekel(priceRaw)}</s> · חיסכון {shekel(discount)}
//               </div>
//             )}

//             {/* דמו + קופון */}
//             <div className="mt-3 grid gap-2 text-sm">
//               <label className="inline-flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   className="accent-violet-600 h-4 w-4"
//                   checked={demo}
//                   onChange={(e) => setDemo(e.target.checked)}
//                 />
//                 <span>מצב דמו (ללא חיוב)</span>
//               </label>
//               <div className="flex items-center gap-2">
//                 <input
//                   placeholder="קופון (LOVE / SIMCHA)"
//                   value={coupon}
//                   onChange={(e) => setCoupon(e.target.value)}
//                   className="mm-input h-10"
//                 />
//                 <button onClick={tryCoupon} className="mm-btn">
//                   החל
//                 </button>
//               </div>
//             </div>

//             <div className="mt-3">
//               <button
//                 className="mm-btn mm-btn-primary w-full btn-glow"
//                 onClick={onContinue}
//               >
//                 {chosen === "free"
//                   ? "הפעל עכשיו"
//                   : `המשך ${demo ? "לדמו" : "לתשלום"}`}
//               </button>
//             </div>
//             <div className="mt-2 text-xs opacity-70">
//               {chosen === "free"
//                 ? "הפעל את המסלול החינמי והתחל לגלוש."
//                 : demo
//                   ? "דמו: תתרשם מהזרימה בלי תשלום."
//                   : "בטוח ומוצפן. ניתן לבטל בהתאם למדיניות."}
//             </div>
//           </aside>
//         </header>

//         {/* PLANS — 4 קלפים */}
//         <section className="mt-10">
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//             {(["free", "plus", "pro", "vip"] as const).map((tier) => {
//               const active = chosen === tier;
//               const p = PRICE[tier][cycle];
//               const off =
//                 couponOk && tier !== "free" ? Math.round(p * couponOk.off) : 0;
//               const pFinal = Math.max(0, p - off);
//               const isVip = tier === "vip";
//               return (
//                 <article
//                   key={tier}
//                   className={cx(
//                     "mm-card p-5 card-fx relative",
//                     active && "ring-2 ring-brand",
//                   )}
//                 >
//                   {isVip && <div className="vip-ribbon">מומלץ לוידאו</div>}
//                   <div className="flex items-start justify-between gap-2">
//                     <div>
//                       <h3 className="text-xl font-extrabold flex items-center gap-2">
//                         {tier.toUpperCase()}
//                       </h3>
//                       <div className="text-sm opacity-70">
//                         {tier === "free"
//                           ? "טעימה חינמית — התחלה מצוינת."
//                           : tier === "plus"
//                             ? "הכלים החשובים במחיר נוח."
//                             : tier === "pro"
//                               ? "מסלול מקצועי עם וידאו/אווטארים."
//                               : "דגל: חשיפה, שידוך ידני ותמיכה גבוהה."}
//                       </div>
//                     </div>
//                     <button
//                       className={cx(
//                         "mm-btn",
//                         active && "mm-btn-primary text-white",
//                       )}
//                       onClick={() => setChosen(tier)}
//                     >
//                       {active ? "נבחר" : "בחר"}
//                     </button>
//                   </div>

//                   <div className="mt-3 text-3xl font-extrabold">
//                     {shekel(pFinal)}
//                     <span className="text-sm opacity-70">
//                       /{cycle === "monthly" ? "חודש" : "שנה"}
//                     </span>
//                   </div>
//                   {!!off && tier !== "free" && (
//                     <div className="text-xs opacity-70">
//                       לפני הנחה: <s>{shekel(p)}</s> · חיסכון {shekel(off)}
//                     </div>
//                   )}

//                   <ul className="mt-4 grid gap-2 text-sm">
//                     {INCLUDED[tier].map((x) => (
//                       <li key={x} className="flex items-start gap-2">
//                         <span>✅</span>
//                         <span>{x}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </article>
//               );
//             })}
//           </div>
//         </section>

//         {/* COMPARISON */}
//         <section className="mt-10">
//           <h2 className="text-xl font-extrabold">השוואת יכולות</h2>
//           <div className="mt-3 overflow-x-auto">
//             <table className="w-full text-sm border-separate border-spacing-y-2">
//               <thead>
//                 <tr className="text-right">
//                   <th className="px-3 py-2">יכולת</th>
//                   <th className="px-3 py-2">FREE</th>
//                   <th className="px-3 py-2">PLUS</th>
//                   <th className="px-3 py-2">PRO</th>
//                   <th className="px-3 py-2">VIP</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[
//                   ["צ׳אט חופשי", "—", "התאמה הדדית", "כן", "כן"],
//                   [
//                     "וידאו",
//                     "דמו/טעימה",
//                     "כן (רגיל)",
//                     "כן (איכותי)",
//                     "כן (פרימיום 1080p)",
//                   ],
//                   ["אווטארים מדברים", "דמו", "—", "כן", "כן"],
//                   ["סופר־לייק", "—", "×1/יום", "×3/יום", "ללא מגבלה סבירה"],
//                   [
//                     "פילוחים",
//                     "בסיסי",
//                     "שימושיים",
//                     "מתקדם + ערכים",
//                     "מתקדם + ערכים",
//                   ],
//                   ["Boost שבועי", "—", "—", "—", "כן"],
//                   ["שידוך ידני (צוות/שדכנית)", "—", "—", "—", "כן"],
//                   ["תמיכה", "בסיסית", "רגילה", "רגילה", "עדיפות גבוהה"],
//                 ].map((row, i) => (
//                   <tr key={i} className="bg-white/70 dark:bg-neutral-900/50">
//                     <td className="px-3 py-2 font-medium">{row[0]}</td>
//                     <td className="px-3 py-2">{row[1]}</td>
//                     <td className="px-3 py-2">{row[2]}</td>
//                     <td className="px-3 py-2">{row[3]}</td>
//                     <td className="px-3 py-2">{row[4]}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         {/* FAQ */}
//         <section className="mt-10 grid gap-3 md:grid-cols-2">
//           <details className="mm-card p-4" open>
//             <summary className="font-semibold cursor-pointer">
//               אפשר לנסות בדמו?
//             </summary>
//             <div className="mt-2 text-sm opacity-80">
//               כן. סמן/י “מצב דמו” ותוכלו להרגיש את הזרימה — ללא חיוב.
//             </div>
//           </details>
//           <details className="mm-card p-4">
//             <summary className="font-semibold cursor-pointer">
//               האם ניתן לבטל?
//             </summary>
//             <div className="mt-2 text-sm opacity-80">
//               בכפוף למדיניות — אנחנו פה לכל שאלה.
//             </div>
//           </details>
//         </section>

//         <div className="h-28" />
//       </main>

//       {/* STICKY SUMMARY */}
//       <div className="fixed inset-x-0 bottom-0 z-40">
//         <div className="mx-auto max-w-6xl px-4 pb-safe">
//           <div className="dock-blur rounded-t-2xl p-3 flex flex-wrap items-center justify-between gap-2">
//             <div className="text-sm">
//               <b>{chosen.toUpperCase()}</b> ·{" "}
//               {cycle === "monthly" ? "חודשי" : "שנתי"} —{" "}
//               <span className="text-brand">{shekel(price)}</span>
//               {!!discount && (
//                 <span className="ms-2 text-xs opacity-80">
//                   (חיסכון {shekel(discount)})
//                 </span>
//               )}
//             </div>
//             <div className="flex items-center gap-2">
//               {chosen !== "free" && (
//                 <label className="inline-flex items-center gap-2 text-xs opacity-85">
//                   <input
//                     type="checkbox"
//                     className="accent-violet-600 h-4 w-4"
//                     checked={demo}
//                     onChange={(e) => setDemo(e.target.checked)}
//                   />
//                   דמו
//                 </label>
//               )}
//               <button className="mm-btn" onClick={() => router.back()}>
//                 חזרה
//               </button>
//               <button
//                 className="mm-btn mm-btn-primary btn-glow"
//                 onClick={onContinue}
//               >
//                 {chosen === "free"
//                   ? "הפעל עכשיו"
//                   : `המשך ${demo ? "לדמו" : "לתשלום"}`}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* MODAL: תשלום/דמו */}
//       {payOpen && (
//         <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
//           <div className="w-[min(96vw,760px)] rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-5 text-right">
//             <div className="flex items-center justify-between">
//               <div className="text-lg font-bold">
//                 {demo ? "דמו — תשלום מדומה" : "תשלום מאובטח"}
//               </div>
//               <button
//                 onClick={() => setPayOpen(false)}
//                 className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="mt-3 grid gap-4 md:grid-cols-2">
//               {/* Summary */}
//               <div className="mm-card p-4">
//                 <div className="text-sm opacity-70">מסלול</div>
//                 <div className="text-2xl font-extrabold">
//                   {chosen.toUpperCase()} ·{" "}
//                   <span className="text-brand">
//                     {shekel(price)} / {cycle === "monthly" ? "חודש" : "שנה"}
//                   </span>
//                 </div>
//                 {!!discount && (
//                   <div className="text-xs opacity-75">
//                     לפני הנחה: <s>{shekel(PRICE[chosen][cycle])}</s> · חיסכון{" "}
//                     {shekel(discount)}{" "}
//                     {couponOk?.code ? `(קופון ${couponOk.code})` : ""}
//                   </div>
//                 )}
//                 <ul className="mt-3 grid gap-1 text-sm opacity-85">
//                   {INCLUDED[chosen].slice(0, 5).map((x) => (
//                     <li key={x}>• {x}</li>
//                   ))}
//                 </ul>
//               </div>

//               {/* Form */}
//               <form
//                 onSubmit={(e) => {
//                   e.preventDefault();
//                   handlePay();
//                 }}
//                 className="grid gap-3"
//               >
//                 {!demo && (
//                   <>
//                     <label className="grid gap-1">
//                       <span className="form-label">מספר כרטיס</span>
//                       <input
//                         className="mm-input input-ltr"
//                         placeholder="4111 1111 1111 1111"
//                         inputMode="numeric"
//                         minLength={16}
//                         maxLength={23}
//                         required
//                       />
//                     </label>
//                     <div className="grid grid-cols-2 gap-3">
//                       <label className="grid gap-1">
//                         <span className="form-label">תוקף</span>
//                         <input
//                           className="mm-input input-ltr"
//                           placeholder="MM/YY"
//                           required
//                         />
//                       </label>
//                       <label className="grid gap-1">
//                         <span className="form-label">CVV</span>
//                         <input
//                           className="mm-input input-ltr"
//                           placeholder="123"
//                           inputMode="numeric"
//                           minLength={3}
//                           maxLength={4}
//                           required
//                         />
//                       </label>
//                     </div>
//                     <label className="grid gap-1">
//                       <span className="form-label">שם בעל/ת הכרטיס</span>
//                       <input className="mm-input input-rtl" required />
//                     </label>
//                   </>
//                 )}

//                 {demo && (
//                   <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 text-sm bg-white/70 dark:bg-neutral-900/50">
//                     מצב דמו פעיל — לא יבוצע חיוב. לחיצה על “סיום” תשלים שדרוג
//                     מדומה ותעביר אותך ליעד.
//                   </div>
//                 )}

//                 {payErr && (
//                   <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-3 text-sm">
//                     {payErr}
//                   </div>
//                 )}

//                 <div className="flex gap-2 justify-end mt-1">
//                   <button
//                     type="button"
//                     onClick={() => setPayOpen(false)}
//                     className="mm-btn"
//                   >
//                     ביטול
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={paying}
//                     className="mm-btn mm-btn-primary btn-glow"
//                   >
//                     {paying ? "מעבד…" : demo ? "סיום (דמו)" : "תשלום"}
//                   </button>
//                 </div>
//               </form>
//             </div>

//             <div className="mt-3 text-[11px] opacity-70">
//               {demo
//                 ? "דמו לצורכי הדגמה בלבד."
//                 : "העסקה תתבצע בצורה מאובטחת ומוצפנת."}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// src/app/(date)/date/upgrade/page.tsx
"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * MATY-DATE — Upgrade (FREE/PLUS/PRO/VIP)
 * - קורא קונפיג ציבורי מהשרת: /api/settings/public
 * - מכבד billing.enabled + minPlanFor (בחירת plan מומלץ לפי feature)
 * - אם billing.enabled=false → מצב דמו כפוי (אין טופס אשראי)
 * - רספונסיבי, RTL, Tailwind
 */

type Feature = "chat" | "video" | "superlike" | "wink";
type Tier = "free" | "plus" | "pro" | "vip";

type PublicSettings = {
  ok: boolean;
  brand?: { orgName: string };
  billing?: {
    enabled: boolean;
    provider: "stripe" | "manual";
    minPlanFor: {
      date_profile: "free" | "plus" | "pro";
      date_matches: "free" | "plus" | "pro";
      date_chat: "free" | "plus" | "pro";
      farbringen_join: "free" | "plus" | "pro";
      club_post_create: "free" | "plus" | "pro";
    };
    upgradeCopy?: string;
  };
  consent?: { version: string; requireForDate: boolean };
};

const ALL_PERKS = {
  chat: "פתיחת צ׳אט",
  video: "שיחת וידאו",
  superlike: "סופר־לייק",
  wink: "קריצה",
};

const INCLUDED: Record<Tier, string[]> = {
  free: [
    "גלישה בסיסית בפרופילים",
    "לייקים מוגבלים ביום",
    "שימוש בסיסי בפילטרים",
    "טיזר וידאו/אווטארים (תצוגת דמו)",
  ],
  plus: [
    "צ׳אט פתוח עם התאמות הדדיות",
    "תמונות/סרטונים באיכות רגילה",
    "פילוחים שימושיים + סינון קהילה/עיר",
    "סופר־לייק ×1 ביום",
  ],
  pro: [
    "צ׳אט פתוח ללא הגבלה",
    "וידאו איכותי + אווטארים מדברים",
    "סופר־לייק ×3 ביום",
    "סינון מתקדם + פילוח ערכים",
    "תמיכה בעדיפות רגילה",
  ],
  vip: [
    "כל יכולות PRO +",
    "וידאו פרימיום 1080p + Boost שבועי",
    "סופר־לייק ללא מגבלה סבירה",
    "שידוך ידני (צוות/שדכנית)",
    "תמיכה בעדיפות גבוהה",
  ],
};

// טבלת מחירים (ברירת מחדל; ניתן להחליף בעתיד לקבילה מהשרת)
const PRICE: Record<Tier, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  plus: { monthly: 49, yearly: 490 },
  pro: { monthly: 89, yearly: 890 },
  vip: { monthly: 130, yearly: 1300 },
};

const RANK: Record<Tier, number> = { free: 0, plus: 1, pro: 2, vip: 3 };
const toTier = (x: string): Tier =>
  x === "vip" ? "vip" : x === "pro" ? "pro" : x === "plus" ? "plus" : "free";

function maxTier(a: Tier, b: Tier): Tier {
  return RANK[a] >= RANK[b] ? a : b;
}
function shekel(n: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(n);
}
function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export default function UpgradePage() {
  const sp = useSearchParams();
  const router = useRouter();

  // פרמטרים נכנסים
  const feature = (sp.get("feature") || "chat") as Feature;
  const src = sp.get("src") || "matches";
  const to = sp.get("to") || null;

  // שליטת UI
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [chosen, setChosen] = useState<Tier>("pro");
  const [demo, setDemo] = useState<boolean>(false);
  const [coupon, setCoupon] = useState("");
  const [couponOk, setCouponOk] = useState<null | {
    code: string;
    off: number;
  }>(null);

  const [brandName, setBrandName] = useState("MATY-DATE");
  const [billingEnabled, setBillingEnabled] = useState<boolean>(true);
  const [minPlanFor, setMinPlanFor] = useState<
    Partial<PublicSettings["billing"]["minPlanFor"]>
  >({});

  // טוענים קונפיג ציבורי
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch("/api/settings/public", { cache: "no-store" });
        const j: PublicSettings = await r
          .json()
          .catch(() => ({ ok: false }) as any);
        if (!dead && j?.ok) {
          setBrandName(j.brand?.orgName || "MATY-DATE");
          setBillingEnabled(!!j.billing?.enabled);
          setMinPlanFor(j.billing?.minPlanFor || {});
          // אם הגבייה כבויה – דמו בכפייה
          if (!j.billing?.enabled) setDemo(true);
        } else if (!dead) {
          // אם נכשל — נשתמש בברירות מחדל
          setBillingEnabled(true);
        }
      } catch {
        if (!dead) setBillingEnabled(true);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  // בחירת מסלול מומלץ לפי feature ו־minPlanFor (אם קיים)
  useEffect(() => {
    // ברירת מחדל מענגת לפי פיצ׳ר
    let suggested: Tier =
      feature === "video" ? "vip" : feature === "chat" ? "plus" : "pro";

    // התאמה למדיניות שרת (אם הוגדרה)
    if (feature === "chat" && minPlanFor?.date_chat) {
      suggested = maxTier(suggested, toTier(minPlanFor.date_chat));
    }
    if (feature === "superlike" || feature === "wink") {
      // כאן אין מפתח ישיר במדיניות — נשארים עם ברירת מחדל “pro”
      suggested = maxTier(suggested, "pro");
    }

    setChosen(suggested);
  }, [feature, minPlanFor]);

  // קופון דמו
  const priceRaw = PRICE[chosen][cycle];
  const discount = couponOk ? Math.round(priceRaw * couponOk.off) : 0;
  const price = Math.max(0, priceRaw - discount);

  function tryCoupon() {
    const code = (coupon || "").trim().toUpperCase();
    if (!code) return setCouponOk(null);
    if (code === "LOVE") setCouponOk({ code, off: 0.25 });
    else if (code === "SIMCHA") setCouponOk({ code, off: 0.15 });
    else setCouponOk(null);
  }

  const featTitle =
    feature === "chat"
      ? "צ׳אט"
      : feature === "video"
        ? "וידאו"
        : ALL_PERKS[feature] || "שדרוג";
  const heroLine = `שדרוג כדי לפתוח ${featTitle} + אווטארים מדברים, תמונות/סרטונים ויכולות חכמות`;

  const focusPerks = useMemo(() => {
    const f = feature;
    const base = [
      f === "chat" && "פתיחת שיחות צ׳אט חופשיות",
      f === "video" && "שיחות וידאו + אווטארים מדברים",
      f === "superlike" && "סופר־לייק בולט ומושך תשומת לב",
      f === "wink" && "קריצה חמימה לשבירת הקרח",
    ].filter(Boolean) as string[];
    const extra =
      chosen === "vip"
        ? ["Boost חשיפה שבועי", "שידוך ידני (צוות/שדכנית)"]
        : chosen === "pro"
          ? ["סינון מתקדם + פילוח ערכים", "תמיכה בעדיפות רגילה"]
          : chosen === "plus"
            ? ["פילוחים שימושיים", "סופר־לייק ×1 ביום"]
            : ["הצצה ליכולות (דמו)"];
    return [...base, ...extra];
  }, [feature, chosen]);

  // המשך — אם FREE מחזיר ישר, אחרת תשלום/דמו
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState<string | null>(null);

  function onContinue() {
    if (chosen === "free" || demo || !billingEnabled) {
      goBackAfterUpgrade();
      return;
    }
    setPayOpen(true);
  }

  function goBackAfterUpgrade() {
    if (to && feature === "chat") {
      router.push(`/date/chat/${encodeURIComponent(to)}?welcome=1`);
    } else if (to && feature === "video") {
      router.push(`/date/video?to=${encodeURIComponent(to)}&welcome=1`);
    } else {
      const back =
        src === "profile"
          ? "/date/profile"
          : src === "matches"
            ? "/date/matches"
            : "/date/matches";
      router.push(back + "?upgraded=1");
    }
  }

  async function handlePay() {
    setPayErr(null);
    setPaying(true);
    try {
      // כאן תרצה להחליף באינטגרציה אמיתית (Stripe/וכו׳) מהצד־שרת
      await new Promise((r) => setTimeout(r, 900));
      setPayOpen(false);
      goBackAfterUpgrade();
    } catch (e: any) {
      setPayErr(e?.message || "שגיאת תשלום");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-transparent to-violet-950/5 dark:to-black/20">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .blink-soft { animation: blinkSoft 2.1s ease-in-out infinite }
          @keyframes blinkSoft { 0%,100%{ filter:none } 50%{ filter:brightness(1.06) saturate(1.06) } }
          .glow { box-shadow: 0 10px 30px rgba(124,58,237,.22) }
          .card-fx { transition: transform .15s ease, box-shadow .2s ease; }
          .card-fx:hover { transform: translateY(-2px); }
          .vip-ribbon { position:absolute; inset-inline-end: -40px; inset-block-start: 14px; transform: rotate(35deg); background:#f59e0b; color:#111; padding: 2px 46px; font-weight:700; font-size:12px; box-shadow:0 6px 18px rgba(0,0,0,.2); }
        `,
        }}
      />
      <main className="mx-auto max-w-6xl px-4 py-10" dir="rtl">
        {/* HERO */}
        <header className="grid gap-6 md:grid-cols-[1.25fr,.75fr] md:items-center">
          <div>
            <div className="mm-badge mm-badge-brand inline-flex items-center gap-1 blink-soft">
              🚀 שדרוג חשבון · {brandName}
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
              {heroLine}
            </h1>
            <p className="mt-2 opacity-80 leading-7">
              מסלולי <b>FREE</b>, <b>PLUS</b>, <b>PRO</b> ו־<b>VIP</b> — צ׳אט,
              וידאו, אווטארים מדברים, סופר־לייק, פילוחים חכמים, Boost שבועי
              (VIP) ועוד.
            </p>

            {/* מחזור חיוב */}
            <div className="mt-4 inline-flex rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 overflow-hidden">
              <button
                className={cx(
                  "h-10 px-4 text-sm font-semibold",
                  cycle === "monthly" && "bg-black/5 dark:bg-white/10",
                )}
                onClick={() => setCycle("monthly")}
              >
                חודשי
              </button>
              <button
                className={cx(
                  "h-10 px-4 text-sm font-semibold",
                  cycle === "yearly" && "bg-black/5 dark:bg-white/10",
                )}
                onClick={() => setCycle("yearly")}
                title="שנה — במחיר מוזל"
              >
                שנתי (חיסכון)
              </button>
            </div>

            {/* יתרונות ממוקדים */}
            <ul className="mt-4 grid gap-1 text-sm opacity-85">
              {focusPerks.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </div>

          {/* סיכום קצר */}
          <aside className="mm-card p-4 card-fx">
            <div className="text-sm opacity-70">מסלול נבחר</div>
            <div className="mt-1 text-2xl font-extrabold">
              {chosen.toUpperCase()} ·{" "}
              <span className="text-brand">
                {shekel(price)}
                <span className="text-sm opacity-70">
                  /{cycle === "monthly" ? "חודש" : "שנה"}
                </span>
              </span>
            </div>
            {!!discount && (
              <div className="text-xs opacity-75">
                לפני הנחה: <s>{shekel(PRICE[chosen][cycle])}</s> · חיסכון{" "}
                {shekel(discount)}
              </div>
            )}

            {/* דמו + קופון */}
            <div className="mt-3 grid gap-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-violet-600 h-4 w-4"
                  checked={demo || !billingEnabled}
                  onChange={(e) => setDemo(e.target.checked)}
                  disabled={!billingEnabled}
                />
                <span>
                  {billingEnabled ? "מצב דמו (ללא חיוב)" : "גבייה כבויה — דמו"}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  placeholder="קופון (LOVE / SIMCHA)"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="mm-input h-10"
                  disabled={!billingEnabled}
                />
                <button
                  onClick={tryCoupon}
                  className="mm-btn"
                  disabled={!billingEnabled}
                >
                  החל
                </button>
              </div>
            </div>

            <div className="mt-3">
              <button
                className="mm-btn mm-btn-primary w-full btn-glow"
                onClick={onContinue}
              >
                {chosen === "free"
                  ? "הפעל עכשיו"
                  : `המשך ${demo || !billingEnabled ? "לדמו" : "לתשלום"}`}
              </button>
            </div>
            <div className="mt-2 text-xs opacity-70">
              {chosen === "free"
                ? "הפעל את המסלול החינמי והתחל לגלוש."
                : demo || !billingEnabled
                  ? "דמו: תתרשם מהזרימה — ללא תשלום."
                  : "בטוח ומוצפן. ניתן לבטל בהתאם למדיניות."}
            </div>
          </aside>
        </header>

        {/* PLANS — 4 קלפים */}
        <section className="mt-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["free", "plus", "pro", "vip"] as const).map((tier) => {
              const active = chosen === tier;
              const p = PRICE[tier][cycle];
              const off =
                couponOk && tier !== "free" && billingEnabled
                  ? Math.round(p * couponOk.off)
                  : 0;
              const pFinal = Math.max(0, p - off);
              const isVip = tier === "vip";
              return (
                <article
                  key={tier}
                  className={cx(
                    "mm-card p-5 card-fx relative",
                    active && "ring-2 ring-brand",
                  )}
                >
                  {isVip && <div className="vip-ribbon">מומלץ לוידאו</div>}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-extrabold flex items-center gap-2">
                        {tier.toUpperCase()}
                      </h3>
                      <div className="text-sm opacity-70">
                        {tier === "free"
                          ? "טעימה חינמית — התחלה מצוינת."
                          : tier === "plus"
                            ? "הכלים החשובים במחיר נוח."
                            : tier === "pro"
                              ? "מסלול מקצועי עם וידאו/אווטארים."
                              : "דגל: חשיפה, שידוך ידני ותמיכה גבוהה."}
                      </div>
                    </div>
                    <button
                      className={cx(
                        "mm-btn",
                        active && "mm-btn-primary text-white",
                      )}
                      onClick={() => setChosen(tier)}
                    >
                      {active ? "נבחר" : "בחר"}
                    </button>
                  </div>

                  <div className="mt-3 text-3xl font-extrabold">
                    {shekel(pFinal)}
                    <span className="text-sm opacity-70">
                      /{cycle === "monthly" ? "חודש" : "שנה"}
                    </span>
                  </div>
                  {!!off && tier !== "free" && (
                    <div className="text-xs opacity-70">
                      לפני הנחה: <s>{shekel(p)}</s> · חיסכון {shekel(off)}
                    </div>
                  )}

                  <ul className="mt-4 grid gap-2 text-sm">
                    {INCLUDED[tier].map((x) => (
                      <li key={x} className="flex items-start gap-2">
                        <span>✅</span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        {/* COMPARISON */}
        <section className="mt-10">
          <h2 className="text-xl font-extrabold">השוואת יכולות</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-right">
                  <th className="px-3 py-2">יכולת</th>
                  <th className="px-3 py-2">FREE</th>
                  <th className="px-3 py-2">PLUS</th>
                  <th className="px-3 py-2">PRO</th>
                  <th className="px-3 py-2">VIP</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["צ׳אט חופשי", "—", "התאמה הדדית", "כן", "כן"],
                  [
                    "וידאו",
                    "דמו/טעימה",
                    "כן (רגיל)",
                    "כן (איכותי)",
                    "כן (פרימיום 1080p)",
                  ],
                  ["אווטארים מדברים", "דמו", "—", "כן", "כן"],
                  ["סופר־לייק", "—", "×1/יום", "×3/יום", "ללא מגבלה סבירה"],
                  [
                    "פילוחים",
                    "בסיסי",
                    "שימושיים",
                    "מתקדם + ערכים",
                    "מתקדם + ערכים",
                  ],
                  ["Boost שבועי", "—", "—", "—", "כן"],
                  ["שידוך ידני (צוות/שדכנית)", "—", "—", "—", "כן"],
                  ["תמיכה", "בסיסית", "רגילה", "רגילה", "עדיפות גבוהה"],
                ].map((row, i) => (
                  <tr key={i} className="bg-white/70 dark:bg-neutral-900/50">
                    <td className="px-3 py-2 font-medium">{row[0]}</td>
                    <td className="px-3 py-2">{row[1]}</td>
                    <td className="px-3 py-2">{row[2]}</td>
                    <td className="px-3 py-2">{row[3]}</td>
                    <td className="px-3 py-2">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10 grid gap-3 md:grid-cols-2">
          <details className="mm-card p-4" open>
            <summary className="font-semibold cursor-pointer">
              אפשר לנסות בדמו?
            </summary>
            <div className="mt-2 text-sm opacity-80">
              כן. סמן/י “מצב דמו” ותוכלו להרגיש את הזרימה — ללא חיוב.
            </div>
          </details>
          <details className="mm-card p-4">
            <summary className="font-semibold cursor-pointer">
              האם ניתן לבטל?
            </summary>
            <div className="mt-2 text-sm opacity-80">
              בכפוף למדיניות — אנחנו פה לכל שאלה.
            </div>
          </details>
        </section>

        <div className="h-28" />
      </main>

      {/* STICKY SUMMARY */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto max-w-6xl px-4 pb-safe">
          <div className="dock-blur rounded-t-2xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <b>{chosen.toUpperCase()}</b> ·{" "}
              {cycle === "monthly" ? "חודשי" : "שנתי"} —{" "}
              <span className="text-brand">{shekel(price)}</span>
              {!!discount && (
                <span className="ms-2 text-xs opacity-80">
                  (חיסכון {shekel(discount)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {chosen !== "free" && (
                <label className="inline-flex items-center gap-2 text-xs opacity-85">
                  <input
                    type="checkbox"
                    className="accent-violet-600 h-4 w-4"
                    checked={demo || !billingEnabled}
                    onChange={(e) => setDemo(e.target.checked)}
                    disabled={!billingEnabled}
                  />
                  דמו
                </label>
              )}
              <button className="mm-btn" onClick={() => router.back()}>
                חזרה
              </button>
              <button
                className="mm-btn mm-btn-primary btn-glow"
                onClick={onContinue}
              >
                {chosen === "free"
                  ? "הפעל עכשיו"
                  : `המשך ${demo || !billingEnabled ? "לדמו" : "לתשלום"}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: תשלום/דמו */}
      {payOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="w-[min(96vw,760px)] rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-5 text-right">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">
                {demo ? "דמו — תשלום מדומה" : "תשלום מאובטח"}
              </div>
              <button
                onClick={() => setPayOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {/* Summary */}
              <div className="mm-card p-4">
                <div className="text-sm opacity-70">מסלול</div>
                <div className="text-2xl font-extrabold">
                  {chosen.toUpperCase()} ·{" "}
                  <span className="text-brand">
                    {shekel(price)} / {cycle === "monthly" ? "חודש" : "שנה"}
                  </span>
                </div>
                {!!discount && (
                  <div className="text-xs opacity-75">
                    לפני הנחה: <s>{shekel(PRICE[chosen][cycle])}</s> · חיסכון{" "}
                    {shekel(discount)}{" "}
                    {couponOk?.code ? `(קופון ${couponOk.code})` : ""}
                  </div>
                )}
                <ul className="mt-3 grid gap-1 text-sm opacity-85">
                  {INCLUDED[chosen].slice(0, 5).map((x) => (
                    <li key={x}>• {x}</li>
                  ))}
                </ul>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePay();
                }}
                className="grid gap-3"
              >
                {/* כשbillingEnabled=false או demo=true לא מציגים טופס אשראי */}
                {billingEnabled && !demo && (
                  <>
                    <label className="grid gap-1">
                      <span className="form-label">מספר כרטיס</span>
                      <input
                        className="mm-input input-ltr"
                        placeholder="4111 1111 1111 1111"
                        inputMode="numeric"
                        minLength={16}
                        maxLength={23}
                        required
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1">
                        <span className="form-label">תוקף</span>
                        <input
                          className="mm-input input-ltr"
                          placeholder="MM/YY"
                          required
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="form-label">CVV</span>
                        <input
                          className="mm-input input-ltr"
                          placeholder="123"
                          inputMode="numeric"
                          minLength={3}
                          maxLength={4}
                          required
                        />
                      </label>
                    </div>
                    <label className="grid gap-1">
                      <span className="form-label">שם בעל/ת הכרטיס</span>
                      <input className="mm-input input-rtl" required />
                    </label>
                  </>
                )}

                {!billingEnabled && (
                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 text-sm bg-white/70 dark:bg-neutral-900/50">
                    גבייה אינה פעילה כרגע. עמוד זה פועל במצב דמו.
                  </div>
                )}
                {demo && billingEnabled && (
                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 text-sm bg-white/70 dark:bg-neutral-900/50">
                    מצב דמו פעיל — לא יבוצע חיוב. לחיצה על “סיום” תשלים שדרוג
                    מדומה ותעביר ליעד.
                  </div>
                )}

                {payErr && (
                  <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 p-3 text-sm">
                    {payErr}
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setPayOpen(false)}
                    className="mm-btn"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={paying}
                    className="mm-btn mm-btn-primary btn-glow"
                  >
                    {paying
                      ? "מעבד…"
                      : demo || !billingEnabled
                        ? "סיום (דמו)"
                        : "תשלום"}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-3 text-[11px] opacity-70">
              {demo || !billingEnabled
                ? "דמו לצורכי הדגמה בלבד."
                : "העסקה תתבצע בצורה מאובטחת ומוצפנת."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
