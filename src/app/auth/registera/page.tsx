// "use client";

// import { useEffect, useState } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { signIn } from "next-auth/react";
// import AvatarPicker from "@/components/AvatarPicker";
// import toast, { Toaster } from "react-hot-toast";

// type StyleKey = "chabad" | "mizrahi" | "soft" | "fun";

// const STYLES: { key: StyleKey; label: string; img: string }[] = [
//   { key: "chabad",  label: "חסידי",  img: "/assets/images/avatar-chabad.png" },
//   { key: "mizrahi", label: "מזרחי",  img: "/assets/images/avatar-mizrahi.png" },
//   { key: "soft",    label: "שקט",    img: "/assets/images/avatar-soft.png" },
//   { key: "fun",     label: "מקפיץ",  img: "/assets/images/avatar-fun.png" },
// ];

// export default function RegisterPage() {
//   const search = useSearchParams();
//   const from = search.get("from") || "/";
//   const router = useRouter();

//   const [style, setStyle] = useState<StyleKey>("soft");
//   const [avatarId, setAvatarId] = useState<string | undefined>(undefined);

//   const [name, setName]       = useState("");
//   const [email, setEmail]     = useState("");
//   const [phone, setPhone]     = useState("");
//   const [password, setPwd]    = useState("");
//   const [showPwd, setShowPwd] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const inputCls =
//     "w-full h-11 rounded-xl border border-black/10 dark:border-white/10 " +
//     "bg-white dark:bg-neutral-900 text-[15px] px-3 outline-none " +
//     "focus:ring-2 focus:ring-brand/40 focus:border-brand/40 transition";

//   useEffect(() => {
//     try {
//       const savedStyle = localStorage.getItem("preferredStyle") as StyleKey | null;
//       const savedAv    = localStorage.getItem("preferredAvatarId") as string | null;
//       if (savedStyle && ["chabad","mizrahi","soft","fun"].includes(savedStyle)) setStyle(savedStyle as StyleKey);
//       if (savedAv) setAvatarId(savedAv);
//     } catch {}
//   }, []);

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     if (loading) return;

//     const emailLower = email.trim().toLowerCase();
//     if (!emailLower || !password) {
//       toast.error("אימייל וסיסמה חובה");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name, email: emailLower, phone, password, style, avatarId }),
//       });

//       const data = await res.json().catch(() => ({}));
//       if (!res.ok) {
//         if (res.status === 409) toast.error("האימייל כבר רשום במערכת");
//         else if (res.status === 400) toast.error(data?.error || "בקשה לא תקינה");
//         else toast.error(data?.error || "שגיאת שרת");
//         setLoading(false);
//         return;
//       }

//       try {
//         localStorage.setItem("preferredStyle", style);
//         if (avatarId) localStorage.setItem("preferredAvatarId", avatarId);
//       } catch {}

//       toast.success("נרשמת בהצלחה! מתחברים…");

//       // התחברות אוטומטית יציבה: redirect:false ואז ניווט ידני
//       const loginRes = await signIn("credentials", {
//         email: emailLower,
//         password,
//         redirect: false,
//       });

//       if (loginRes?.ok) {
//         router.replace(from);
//       } else {
//         console.log("signin(credentials) result:", loginRes);
//         toast.error(loginRes?.error || "התחברות אוטומטית נכשלה");
//         setLoading(false);
//       }
//     } catch (err: any) {
//       toast.error(err?.message || "שגיאה בלתי צפויה");
//       setLoading(false);
//     }
//   }

//   return (
//     <>
//       <Toaster position="top-center" />
//       <div className="min-h-dvh grid place-items-center px-4 py-10">
//         <motion.div
//           initial={{ opacity: 0, y: 10, scale: 0.98 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           transition={{ type: "spring", stiffness: 320, damping: 28 }}
//           className="w-[min(92vw,760px)] rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 shadow-xl overflow-hidden"
//         >
//           <div className="p-6 border-b border-black/10 dark:border-white/10 text-center">
//             <img
//               src="/assets/logo/maty-music-wordmark.svg"
//               alt="MATY MUSIC"
//               className="mx-auto h-10 mb-2"
//               onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
//             />
//             <h1 className="text-2xl font-extrabold">הרשמה</h1>
//             <p className="text-sm opacity-70">הצטרפו ונהנו מפלייליסטים, הזמנות ועוד</p>
//           </div>

//           <form onSubmit={onSubmit} className="grid gap-6 p-6" aria-busy={loading}>
//             <div>
//               <div className="mb-2 font-semibold">איזה סגנון מוזיקה את/ה הכי אוהב/ת?</div>
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                 {STYLES.map((s) => (
//                   <button
//                     key={s.key}
//                     type="button"
//                     onClick={() => setStyle(s.key)}
//                     className={[
//                       "group rounded-2xl border p-3 text-center transition",
//                       style === s.key
//                         ? "border-brand ring-2 ring-brand/40 bg-brand/5"
//                         : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5",
//                     ].join(" ")}
//                     aria-pressed={style === s.key}
//                   >
//                     <img
//                       src={s.img}
//                       alt=""
//                       className="mx-auto h-14 w-14 object-contain"
//                       onError={(e) => {
//                         (e.currentTarget as HTMLImageElement).style.opacity = "0.25";
//                       }}
//                     />
//                     <div className="mt-2 text-sm font-medium">{s.label}</div>
//                   </button>
//                 ))}
//               </div>
//               <p className="text-xs opacity-70 mt-2">
//                 אפשר לשנות אחר־כך בפרופיל. הדמות באתר תתאים לסגנון שבחרת.
//               </p>
//             </div>

//             <div>
//               <div className="mb-2 font-semibold">או בחר/י אווטר עגול (אופציונלי)</div>
//               <AvatarPicker value={avatarId} onChange={setAvatarId} />
//               <p className="text-xs opacity-70 mt-2">נשמר בדפדפן; משמש בעיקר לאייקון העגול.</p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <label className="grid gap-1">
//                 <span className="text-sm">שם</span>
//                 <input
//                   className={inputCls}
//                   placeholder="כינוי או שם מלא"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                 />
//               </label>

//               <label className="grid gap-1">
//                 <span className="text-sm">אימייל *</span>
//                 <input
//                   className={inputCls}
//                   type="email"
//                   placeholder="you@example.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                 />
//               </label>

//               <label className="grid gap-1">
//                 <span className="text-sm">טלפון</span>
//                 <input
//                   className={inputCls}
//                   placeholder="050-..."
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value)}
//                 />
//               </label>

//               <label className="grid gap-1">
//                 <span className="text-sm">סיסמה *</span>
//                 <div className="relative">
//                   <input
//                     className={inputCls + " pr-10"}
//                     type={showPwd ? "text" : "password"}
//                     placeholder="מינימום 6 תווים"
//                     value={password}
//                     onChange={(e) => setPwd(e.target.value)}
//                     minLength={6}
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPwd((v) => !v)}
//                     className="absolute inset-y-0 left-2 my-auto text-xs opacity-70 hover:opacity-100"
//                     aria-label="הצג/הסתר סיסמה"
//                   >
//                     {showPwd ? "הסתר" : "הצג"}
//                   </button>
//                 </div>
//               </label>
//             </div>

//             <div className="grid gap-3">
//               <button type="submit" disabled={loading} className="btn w-full">
//                 {loading ? "נרשם…" : "הרשמה"}
//               </button>

//               <button
//                 type="button"
//                 onClick={() => signIn("google", { callbackUrl: from })}
//                 className="btn w-full border"
//                 disabled={loading}
//               >
//                 המשך עם Google
//               </button>
//             </div>

//             <div className="text-center text-[11px] opacity-70">
//               בלחיצה אתם מאשרים את{" "}
//               <Link href="/terms" className="underline">
//                 תנאי השימוש
//               </Link>{" "}
//               ו־{" "}
//               <Link href="/privacy" className="underline">
//                 מדיניות הפרטיות
//               </Link>
//               .
//             </div>

//             <div className="text-center text-sm opacity-80">
//               כבר רשומים?{" "}
//               <Link
//                 href={`/auth/signin?from=${encodeURIComponent(from)}`}
//                 className="underline"
//               >
//                 כניסה
//               </Link>
//             </div>
//           </form>
//         </motion.div>
//       </div>
//     </>
//   );
// }
