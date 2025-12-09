// // src/app/auth/page.tsx
// "use client";

// import { useEffect, useState, FormEvent } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { signIn, useSession } from "next-auth/react";
// import {
//   Mail, Lock, Eye, EyeOff, User2, Phone, Loader2
// } from "lucide-react";

// type StyleKey = "chabad" | "mizrahi" | "soft" | "fun";
// const STYLES: { key: StyleKey; label: string; img: string }[] = [
//   { key: "chabad",  label: "חסידי",  img: "/assets/images/avatar-chabad.png" },
//   { key: "mizrahi", label: "מזרחי",  img: "/assets/images/avatar-mizrahi.png" },
//   { key: "soft",    label: "שקט",    img: "/assets/images/avatar-soft.png" },
//   { key: "fun",     label: "מקפיץ",  img: "/assets/images/avatar-fun.png" },
// ];

// const isStyle = (g: any): g is StyleKey => ["chabad","mizrahi","soft","fun"].includes(g);
// const emailOk = (s: string) => /^\S+@\S+\.\S+$/.test(s);
// function passScore(pw: string) {
//   let s = 0; if (pw.length >= 8) s++; if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++; return s;
// }

// export default function AuthPage() {
//   const sp = useSearchParams();
//   const from = sp.get("from") || "/";
//   const oauthError = sp.get("error") || null;
//   const router = useRouter();
//   const { status } = useSession();

//   const [mode, setMode] = useState<"login" | "register">("login");

//   // שדות משותפים
//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [email, setEmail] = useState("");
//   const [pw, setPw] = useState("");
//   const [pw2, setPw2] = useState("");

//   // אווטאר/סגנון להרשמה
//   const [style, setStyle] = useState<StyleKey>("soft");
//   const [avatarId, setAvatarId] = useState<string | undefined>(undefined);

//   const [showPw, setShowPw] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const s = passScore(pw);

//   // מחובר? נחזיר לדף הקודם
//   useEffect(() => {
//     if (status === "authenticated") router.replace(from);
//   }, [status, from, router]);

//   // טעינת בחירות קודמות + הודעות OAuth
//   useEffect(() => {
//     if (oauthError === "OAuthAccountNotLinked") {
//       console.info("OAuthAccountNotLinked: אותו אימייל שייך לחשבון אחר. התחבר בסיסמה.");
//     }
//     try {
//       const savedStyle = localStorage.getItem("preferredStyle") as StyleKey | null;
//       const savedAv    = localStorage.getItem("preferredAvatarId") as string | null;
//       if (savedStyle && isStyle(savedStyle)) setStyle(savedStyle);
//       if (savedAv) setAvatarId(savedAv);
//     } catch {}
//   }, [oauthError]);

//   // עזר: עדכון העדפות בשרת מיד אחרי לוגין כדי למנוע חזרה ל-soft
//   async function postPrefsAfterLogin(chosen: StyleKey) {
//     try {
//       await fetch("/api/user/prefs", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         // נשמור גם כ-lastPlayedGenre (וגם future-proof אם תוסיף preferredGenres)
//         body: JSON.stringify({ lastPlayedGenre: chosen }),
//         cache: "no-store",
//       });
//     } catch (e) {
//       console.info("[auth] prefs POST failed (non-fatal):", e);
//     }
//   }

//   // עזר: שידור שינוי אווטאר מיידי
//   function applyGenreInstant(g: StyleKey) {
//     try {
//       window.dispatchEvent(new CustomEvent("mm:setCategory", { detail: { category: g } }));
//       (window as any).SiteCompanion?.setGenre?.(g);
//     } catch {}
//   }

//   async function onSubmit(e: FormEvent) {
//     e.preventDefault();
//     if (loading) return;
//     setLoading(true);
//     try {
//       if (!emailOk(email)) throw new Error("כתובת אימייל לא תקינה");

//       if (mode === "register") {
//         if (pw !== pw2) throw new Error("האימות לא תואם לסיסמה");
//         if (pw.length < 6) throw new Error("הסיסמה צריכה להיות באורך 6 תווים לפחות");

//         const emailLower = email.trim().toLowerCase();

//         // 1) הרשמה
//         const r = await fetch("/api/auth/register", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ name, email: emailLower, password: pw, phone, style, avatarId }),
//         });
//         const data = await r.json().catch(() => ({}));
//         if (!r.ok || !data?.ok) throw new Error(data?.error || "שגיאה בהרשמה");

//         // שמירה מקומית כדי ש-PrefsBoot יוכל לבחור מיידית
//         try {
//           localStorage.setItem("preferredStyle", style);
//           if (avatarId) localStorage.setItem("preferredAvatarId", avatarId);
//         } catch {}

//         // 2) לוגין
//         const res = await signIn("credentials", { email: emailLower, password: pw, redirect: false, callbackUrl: from });
//         if (!res?.ok) throw new Error("התחברות אוטומטית נכשלה");

//         // 3) אפליי מיידי + עדכון בשרת, ואז ניווט
//         applyGenreInstant(style);
//         await postPrefsAfterLogin(style);
//         router.replace(from);

//       } else {
//         // LOGIN
//         const res = await signIn("credentials", { email, password: pw, redirect: false, callbackUrl: from });
//         if (!res?.ok) throw new Error("פרטי התחברות שגויים");
//         router.replace(from);
//       }
//     } catch (err: any) {
//       alert(err?.message || "שגיאה לא צפויה");
//     } finally {
//       setLoading(false);
//     }
//   }

//   // המשך עם Google — שומרים את ה-style קודם כדי ש-PrefsBoot יוכל להשתמש בו כ-fallback מיד לאחר החזרה מה-redirect
//   async function onGoogle() {
//     try {
//       localStorage.setItem("preferredStyle", style);
//       if (avatarId) localStorage.setItem("preferredAvatarId", avatarId);
//     } catch {}
//     // עם OAuth חייבים redirect
//     await signIn("google", { callbackUrl: from });
//   }

//   return (
//     <div className="min-h-dvh bg-gradient-to-b from-neutral-100 to-white dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
//       <motion.div
//         initial={{ opacity: 0, y: 16 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="w-full max-w-3xl rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-950/70 backdrop-blur shadow-xl overflow-hidden"
//       >
//         <div className="p-6 border-b border-black/10 dark:border-white/10">
//           <h1 className="text-2xl font-extrabold text-right">ברוך הבא</h1>
//           <p className="text-right text-sm opacity-70">התחבר או הירשם כדי להמשיך</p>
//         </div>

//         {/* טאבים */}
//         <div className="p-2 grid grid-cols-2 gap-2">
//           <button
//             className={`rounded-xl py-2 text-sm border transition ${mode === "login" ? "bg-black text-white border-black" : "bg-transparent border-black/10 dark:border-white/10"}`}
//             onClick={() => setMode("login")}
//             disabled={loading}
//           >
//             כניסה
//           </button>
//           <button
//             className={`rounded-xl py-2 text-sm border transition ${mode === "register" ? "bg-black text-white border-black" : "bg-transparent border-black/10 dark:border-white/10"}`}
//             onClick={() => setMode("register")}
//             disabled={loading}
//           >
//             הרשמה
//           </button>
//         </div>

//         <div className="grid md:grid-cols-2 gap-6 p-6 pt-2">
//           {/* צד שמאל: פרטי חשבון */}
//           <form onSubmit={onSubmit} className="grid gap-3">
//             {mode === "register" && (
//               <div className="relative">
//                 <User2 className="absolute right-3 top-2.5 h-4 w-4 opacity-60" />
//                 <input
//                   className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent pr-9 px-3 py-2 text-right"
//                   placeholder="שם מלא"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   disabled={loading}
//                 />
//               </div>
//             )}

//             <div className="relative">
//               <Mail className="absolute right-3 top-2.5 h-4 w-4 opacity-60" />
//               <input
//                 className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent pr-9 px-3 py-2 text-right"
//                 type="email"
//                 placeholder="אימייל"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 disabled={loading}
//                 required
//                 autoComplete="email"
//               />
//             </div>

//             {mode === "register" && (
//               <div className="relative">
//                 <Phone className="absolute right-3 top-2.5 h-4 w-4 opacity-60" />
//                 <input
//                   className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent pr-9 px-3 py-2 text-right"
//                   type="tel"
//                   placeholder="טלפון (אופציונלי)"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value)}
//                   disabled={loading}
//                   autoComplete="tel"
//                 />
//               </div>
//             )}

//             <div className="relative">
//               <Lock className="absolute right-3 top-2.5 h-4 w-4 opacity-60" />
//               <input
//                 className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent pr-9 pl-10 px-3 py-2 text-right"
//                 type={showPw ? "text" : "password"}
//                 placeholder="סיסמה"
//                 value={pw}
//                 onChange={(e) => setPw(e.target.value)}
//                 disabled={loading}
//                 required
//                 autoComplete={mode === "register" ? "new-password" : "current-password"}
//                 minLength={6}
//               />
//               <button
//                 type="button"
//                 className="absolute left-2 top-2 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
//                 onClick={() => setShowPw(v => !v)}
//                 aria-label="toggle password"
//               >
//                 {showPw ? <EyeOff className="h-4 w-4 opacity-70" /> : <Eye className="h-4 w-4 opacity-70" />}
//               </button>
//             </div>

//             {mode === "register" && (
//               <>
//                 <div className="relative">
//                   <Lock className="absolute right-3 top-2.5 h-4 w-4 opacity-60" />
//                   <input
//                     className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent pr-9 pl-10 px-3 py-2 text-right"
//                     type={showPw ? "text" : "password"}
//                     placeholder="אימות סיסמה"
//                     value={pw2}
//                     onChange={(e) => setPw2(e.target.value)}
//                     disabled={loading}
//                     required
//                     minLength={6}
//                   />
//                 </div>

//                 {/* מד חוזק סיסמה */}
//                 <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
//                   <div
//                     className={`h-full transition-all ${
//                       s <= 1 ? "bg-red-500" : s === 2 ? "bg-yellow-500" : s === 3 ? "bg-emerald-500" : "bg-emerald-600"
//                     }`}
//                     style={{ width: `${(s / 4) * 100}%` }}
//                   />
//                 </div>
//                 <p className="text-[11px] opacity-60 text-right">
//                   סיסמה חזקה: לפחות 8 תווים, אות גדולה, מספר ותו מיוחד.
//                 </p>
//               </>
//             )}

//             <button
//               type="submit"
//               className="rounded-xl py-2 bg-black text-white hover:brightness-95 disabled:opacity-60 flex items-center justify-center gap-2"
//               disabled={loading}
//             >
//               {loading && <Loader2 className="h-4 w-4 animate-spin" />}
//               {mode === "register" ? "הרשמה" : "כניסה"}
//             </button>

//             <button
//               type="button"
//               onClick={onGoogle}
//               className="rounded-xl py-2 border border-black/10 dark:border-white/10"
//               disabled={loading}
//             >
//               המשך עם Google
//             </button>

//             <p className="text-[11px] opacity-60 mt-2 text-right">
//               בלחיצה אתה מאשר את תנאי השירות והפרטיות.
//             </p>
//             <div className="text-right text-sm">
//               כבר רשום? <Link href={`/signin?from=${encodeURIComponent(from)}`} className="underline">כניסה</Link>
//             </div>
//           </form>

//           {/* צד ימין: בחירת סגנון/אווטאר (מופיע רק בהרשמה) */}
//           {mode === "register" && (
//             <div className="grid gap-6">
//               <div>
//                 <div className="mb-2 font-semibold text-right">איזה סגנון מוזיקה?</div>
//                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                   {STYLES.map((s) => (
//                     <button
//                       key={s.key}
//                       type="button"
//                       onClick={() => setStyle(s.key)}
//                       className={[
//                         "group rounded-2xl border p-3 text-center transition",
//                         style === s.key
//                           ? "border-violet-500 ring-2 ring-violet-500/30 bg-violet-500/5"
//                           : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5",
//                       ].join(" ")}
//                       aria-pressed={style === s.key}
//                     >
//                       {/* eslint-disable-next-line @next/next/no-img-element */}
//                       <img
//                         src={s.img}
//                         alt=""
//                         className="mx-auto h-14 w-14 object-contain"
//                         onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0.25")}
//                       />
//                       <div className="mt-2 text-sm font-medium">{s.label}</div>
//                     </button>
//                   ))}
//                 </div>
//                 <p className="text-xs opacity-70 mt-2 text-right">
//                   אפשר לשנות אחר־כך בפרופיל. הדמות באתר תתאים אוטומטית לסגנון.
//                 </p>
//               </div>

//               {/* אופציונלי: מזהה אווטאר מותאם אישית */}
//               <div>
//                 <div className="mb-2 font-semibold text-right">מזהה אווטאר (לא חובה)</div>
//                 <input
//                   className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-right"
//                   placeholder="למי שמשתמש ב־AvatarPicker / מזהה פנימי"
//                   value={avatarId || ""}
//                   onChange={(e) => setAvatarId(e.target.value || undefined)}
//                 />
//               </div>
//             </div>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }
