// // src/components/Hero3D.tsx
// "use client";

// /**
//  * Hero3D — גרסת "מהירה וחיה"
//  * - Progressive textures (createImageBitmap) + cache
//  * - useProgress + Loader מינימלי
//  * - PerformanceMonitor לאדפטציית DPR/איכות
//  * - Pause when offscreen (IntersectionObserver)
//  * - חלקיקים קלים + ריפלים לפי ביט מהמוזיקה
//  * - RTL + נגישות + reduced motion
//  */

// import {
//   useRef,
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
//   Suspense,
//   memo,
//   startTransition,
// } from "react";
// import { motion, AnimatePresence, useReducedMotion, useInView } from "framer-motion";
// import dynamic from "next/dynamic";
// import * as THREE from "three";
// import { useFrame, useThree } from "@react-three/fiber";
// import {
//   useTexture,
//   Preload,
//   Html,
//   useProgress,
//   PerformanceMonitor,
// } from "@react-three/drei";
// import { useAudioPulse } from "@/hooks/useAudioPulse";
// import { useAudioBands } from "@/hooks/useAudioBands";

// // Canvas ללא SSR למנוע hydration mismatch
// const Canvas = dynamic(() => import("@react-three/fiber").then(m => m.Canvas), { ssr: false });

// type CategoryKey = "chabad" | "mizrahi" | "soft" | "fun";
// type Cat = { key: CategoryKey; label: string; imgs: string[]; headline: string; blurb: string };

// const CATEGORIES: Cat[] = [
//   {
//     key: "chabad",
//     label: "חסידי (חב״ד)",
//     imgs: ["/assets/images/avatar-chabad.png"],
//     headline: "ניגונים שמרימים את הנפש",
//     blurb: "חום של התוועדות, ביטים מודרניים ונשמה חסידית.",
//   },
//   {
//     key: "mizrahi",
//     label: "מזרחי",
//     imgs: ["/assets/images/avatar-mizrahi.png"],
//     headline: "ים־תיכוני בועט",
//     blurb: "גרוב של חאפלה, כינורות ותופים שמזיזים את הרחבה.",
//   },
//   {
//     key: "soft",
//     label: "שקט",
//     imgs: ["/assets/images/avatar-soft.png"],
//     headline: "שירים לנשימה עמוקה",
//     blurb: "בלדות עדינות, צליל נקי ורוגע אחרי יום ארוך.",
//   },
//   {
//     key: "fun",
//     label: "מקפיץ",
//     imgs: ["/assets/images/avatar-fun.png"],
//     headline: "בוסט של אנרגיה",
//     blurb: "ביטים חדים, הוקים קליטים ואווירת מסיבה.",
//   },
// ];

// // פריסת מיקום/עומק (x,y,z)
// const LAYOUT: ReadonlyArray<[number, number, number]> = [
//   [0.35, 0.16, 0.00],
//   [0.72, -0.04, 0.12],
//   [0.24, -0.26, 0.28],
//   [0.94, 0.08, 0.42],
// ];

// /* ============================================================
//    טעינה חכמה של תמונות עם createImageBitmap + cache בזיכרון
//    ============================================================ */

// const bitmapCache = new Map<string, THREE.Texture>();
// const pendingCache = new Map<string, Promise<THREE.Texture>>();

// async function loadBitmapTexture(url: string): Promise<THREE.Texture> {
//   if (bitmapCache.has(url)) return bitmapCache.get(url)!;
//   if (pendingCache.has(url)) return pendingCache.get(url)!;

//   const job = (async () => {
//     // נסה createImageBitmap (מהיר) עם decode async; fallback ל-Image
//     try {
//       const resp = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache" });
//       const blob = await resp.blob();
//       // HINT: premultiplyAlpha false לשקיפות נקייה
//       const bmp = await createImageBitmap(blob, { colorSpaceConversion: "default", premultiplyAlpha: "none" as any });
//       const tex = new THREE.Texture(bmp);
//       (tex as any).colorSpace = (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding;
//       tex.anisotropy = 8;
//       tex.generateMipmaps = true;
//       tex.minFilter = THREE.LinearMipmapLinearFilter;
//       tex.magFilter = THREE.LinearFilter;
//       tex.needsUpdate = true;
//       bitmapCache.set(url, tex);
//       return tex;
//     } catch {
//       // Fallback — כמו useTexture רגיל
//       const loader = new THREE.TextureLoader();
//       return await new Promise<THREE.Texture>((resolve, reject) => {
//         loader.setCrossOrigin("anonymous");
//         loader.load(
//           url,
//           (tex) => {
//             if ("colorSpace" in tex) (tex as any).colorSpace = (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding;
//             tex.anisotropy = 8;
//             tex.generateMipmaps = true;
//             tex.minFilter = THREE.LinearMipmapLinearFilter;
//             tex.magFilter = THREE.LinearFilter;
//             tex.needsUpdate = true;
//             bitmapCache.set(url, tex);
//             resolve(tex);
//           },
//           undefined,
//           reject
//         );
//       });
//     }
//   })();

//   pendingCache.set(url, job);
//   try {
//     const tex = await job;
//     return tex;
//   } finally {
//     pendingCache.delete(url);
//   }
// }

// /* ============================================================
//    useSmartUrl — בוחר URL תקין ראשון (כבר יש אצלך), עם preload
//    ============================================================ */
// function useSmartUrl(candidates: string[]) {
//   const [url, setUrl] = useState<string | null>(null);
//   useEffect(() => {
//     let alive = true;

//     // Preload <link rel="preload"> (hint ל-NG/Chrome)
//     candidates.forEach((u) => {
//       const l = document.createElement("link");
//       l.rel = "preload";
//       l.as = "image";
//       l.href = u;
//       document.head.appendChild(l);
//       // ניקוי
//       setTimeout(() => l.remove(), 4000);
//     });

//     (async () => {
//       for (const u of candidates) {
//         const ok = await new Promise<boolean>((res) => {
//           const img = new Image();
//           img.decoding = "async";
//           img.loading = "eager";
//           img.crossOrigin = "anonymous";
//           img.onload = () => res(true);
//           img.onerror = () => res(false);
//           img.src = u;
//         });
//         if (!alive) return;
//         if (ok) {
//           setUrl(u);
//           break;
//         }
//       }
//     })();

//     return () => { alive = false; };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [candidates.join("|")]);

//   return url;
// }

// /* ============================================================
//    Loader מינימלי (מבוסס useProgress)
//    ============================================================ */
// const SceneLoader = memo(function SceneLoader() {
//   const { progress, active, loaded, total, item } = useProgress();
//   const pct = Math.floor(progress);
//   return (
//     <Html center style={{ pointerEvents: "none" }}>
//       <div
//         dir="rtl"
//         className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur px-4 py-2 text-sm shadow-lg"
//       >
//         {active ? (
//           <div className="flex items-center gap-2">
//             <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-black/70 dark:bg-white/70" />
//             <span>טוען סצנה… {pct}%</span>
//           </div>
//         ) : (
//           <span>מוכן ✓</span>
//         )}
//       </div>
//     </Html>
//   );
// });

// /* ============================================================
//    AvatarPlane — עם טינט דינמי + beat/pulse + progressive texture
//    ============================================================ */
// function AvatarPlane({
//   url,
//   base,
//   mouse,
//   phase = 0,
//   depth = 0,
//   focus = 0.6,
//   reduceMotion = false,
//   reactToBeat = true,
//   quality = 1,
// }: {
//   url: string;
//   base: [number, number];
//   mouse: THREE.Vector2;
//   phase?: number;
//   depth?: number;
//   focus?: number;
//   reduceMotion?: boolean;
//   reactToBeat?: boolean;
//   quality?: number; // 0.5..1
// }) {
//   const matRef = useRef<THREE.MeshBasicMaterial>(null);
//   const g = useRef<THREE.Group>(null);
//   const texRef = useRef<THREE.Texture | null>(null);
//   const [size, setSize] = useState<[number, number] | null>(null);
//   const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
//   const tint = useRef(new THREE.Color(0xffffff));

//   // Progressive texture load (bitmap)
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       const tex = await loadBitmapTexture(url);
//       if (!alive) return;
//       // עדכון איכות דינמית
//       tex.anisotropy = Math.max(4, Math.min(16, (maxAniso || 16) * quality));
//       tex.needsUpdate = true;
//       texRef.current = tex;
//       const img: any = tex.image;
//       const w = img?.width ?? 1;
//       const h = img?.height ?? 1;
//       setSize([w, h]);
//       startTransition(() => {
//         matRef.current?.setValues({ map: tex, opacity: 0.85 });
//         matRef.current?.needsUpdate && (matRef.current.needsUpdate = true);
//       });
//     })();
//     return () => { alive = false; };
//   }, [url, maxAniso, quality]);

//   const baseH = 1.32;
//   const planeW = useMemo(() => {
//     if (!size) return baseH;
//     const [w, h] = size;
//     return baseH * (w / h);
//   }, [size]);

//   // אודיו
//   const { level, beatTick } = useAudioPulse(0.9);
//   const lastBeat = useRef(0);
//   const beatBoost = useRef(0); // 0..1

//   const { bass, treble } = useAudioBands(0.88);
//   const bandsRef = useRef({ bass: 0, treble: 0 });
//   useEffect(() => { bandsRef.current = { bass, treble }; }, [bass, treble]);

//   useFrame(({ clock }) => {
//     if (!g.current) return;
//     const t = clock.getElapsedTime() + phase;

//     const mx = THREE.MathUtils.clamp(mouse.x, -0.8, 0.8);
//     const my = THREE.MathUtils.clamp(mouse.y, -0.8, 0.8);
//     const parallaxX = reduceMotion ? 0 : mx * (0.10 + depth * 0.04);
//     const parallaxY = reduceMotion ? 0 : -my * (0.07 + depth * 0.03);

//     // beat boost קצר
//     if (reactToBeat && lastBeat.current !== beatTick) {
//       lastBeat.current = beatTick;
//       beatBoost.current = 1;
//     }
//     beatBoost.current = Math.max(0, beatBoost.current * 0.86);

//     const bobY = reduceMotion ? 0 : Math.sin(t * (1.1 + depth * 0.15)) * 0.05;
//     const rotY = reduceMotion ? 0 : Math.sin(t * 0.9) * (0.05 + depth * 0.02);
//     const rotX = reduceMotion ? 0 : Math.cos(t * 1.2) * (0.04 + depth * 0.02);

//     const targetOpacity = 0.25 + 0.75 * focus;
//     const focusScale = 1 + 0.09 * (focus - 0.6);

//     if (matRef.current) {
//       matRef.current.opacity = THREE.MathUtils.lerp(
//         matRef.current.opacity ?? 1,
//         targetOpacity,
//         0.15
//       );
//     }

//     // מיקום, רוטציה
//     g.current.position.set(
//       base[0] + parallaxX,
//       base[1] + bobY + parallaxY,
//       -depth
//     );

//     // "ריקוד"
//     const dance = reduceMotion ? 0 : level * 0.11 + beatBoost.current * 0.15;
//     g.current.rotation.set(rotX + dance * 0.02, rotY - dance * 0.02, 0);

//     // נשימה + פולס
//     const breathe = reduceMotion ? 1 : 1 + Math.sin(t * 1.6) * 0.012;
//     const pulse = reduceMotion ? 1 : breathe + level * 0.05 + beatBoost.current * 0.06;
//     g.current.scale.set(pulse * focusScale, pulse * focusScale, 1);

//     // קפיצה קטנה על beat
//     g.current.position.y += reduceMotion ? 0 : beatBoost.current * 0.06;

//     // 🎨 טינט לפי באס/טרבל (260°←Treble … 40°←Bass)
//     if (!reduceMotion && matRef.current) {
//       const { bass: b, treble: tr } = bandsRef.current;
//       const mix = b / (b + tr + 1e-4); // 0..1
//       const hue = 260 - 220 * mix; // 260→40
//       const sat = THREE.MathUtils.clamp(0.25 + Math.max(b, tr) * 0.6, 0.25, 0.9);
//       const light = 0.95;
//       tint.current.setHSL(hue / 360, sat, light);
//       matRef.current.color.lerp(tint.current, 0.15);
//     }
//   });

//   return (
//     <group ref={g}>
//       {/* Shadow-blur עדין מאחורי האווטאר */}
//       {!reduceMotion && (
//         <mesh position={[0, -0.02, -0.0001]}>
//           <planeGeometry args={[planeW * 0.9, baseH * 0.28]} />
//           <meshBasicMaterial transparent opacity={0.18} color="#000" />
//         </mesh>
//       )}

//       <mesh>
//         <planeGeometry args={[planeW, baseH]} />
//         <meshBasicMaterial
//           ref={matRef}
//           transparent
//           alphaTest={0.05}
//           color="white"
//           opacity={0.8}
//           // map מתעדכן כש-texture מוכן (ב-effect)
//         />
//       </mesh>
//     </group>
//   );
// }

// /* ============================================================
//    ParticleField — InstancedMesh קליל (120-200 חלקיקים)
//    ============================================================ */
// const ParticleField = memo(function ParticleField({
//   count = 160,
//   area = [1.8, 1.2],
//   depth = 1.2,
//   reduceMotion = false,
//   quality = 1,
// }: {
//   count?: number;
//   area?: [number, number];
//   depth?: number;
//   reduceMotion?: boolean;
//   quality?: number;
// }) {
//   const ref = useRef<THREE.InstancedMesh>(null);
//   const dummy = useMemo(() => new THREE.Object3D(), []);
//   const speeds = useMemo(() => Float32Array.from({ length: count }, () => 0.1 + Math.random() * 0.6), [count]);
//   const offsets = useMemo(() => Float32Array.from({ length: count }, () => Math.random() * Math.PI * 2), [count]);

//   useEffect(() => {
//     if (!ref.current) return;
//     for (let i = 0; i < count; i++) {
//       const x = (Math.random() - 0.5) * area[0];
//       const y = (Math.random() - 0.5) * area[1];
//       const z = -Math.random() * depth;
//       dummy.position.set(x, y, z);
//       const s = (reduceMotion ? 0.004 : 0.006) * (0.6 + Math.random() * 0.8) * quality;
//       dummy.scale.setScalar(s);
//       dummy.rotation.z = Math.random() * Math.PI;
//       dummy.updateMatrix();
//       ref.current.setMatrixAt(i, dummy.matrix);
//     }
//     ref.current.instanceMatrix.needsUpdate = true;
//   }, [count, area, depth, dummy, reduceMotion, quality]);

//   useFrame((_, dt) => {
//     if (!ref.current || reduceMotion) return;
//     for (let i = 0; i < count; i++) {
//       const m = new THREE.Matrix4();
//       ref.current.getMatrixAt(i, m);
//       const p = new THREE.Vector3().setFromMatrixPosition(m);
//       const s = speeds[i] * 0.04 * (quality * 0.9 + 0.1);
//       p.y += Math.sin(offsets[i] + performance.now() * 0.0006) * s * 0.2;
//       p.x += Math.cos(offsets[i] + performance.now() * 0.0004) * s * 0.15;
//       if (p.y > area[1] * 0.6) p.y = -area[1] * 0.6;
//       if (p.x > area[0] * 0.6) p.x = -area[0] * 0.6;
//       dummy.position.copy(p);
//       dummy.updateMatrix();
//       ref.current.setMatrixAt(i, dummy.matrix);
//     }
//     ref.current.instanceMatrix.needsUpdate = true;
//   });

//   return (
//     <instancedMesh ref={ref} args={[undefined as any, undefined as any, count]}>
//       <planeGeometry args={[1, 1]} />
//       <meshBasicMaterial transparent opacity={0.10} color="#ffffff" />
//     </instancedMesh>
//   );
// });

// /* ============================================================
//    BeatRipples — טבעות דקיקות שמתפשטות על ביט
//    ============================================================ */
// function BeatRipples({ reduceMotion = false }: { reduceMotion?: boolean }) {
//   const group = useRef<THREE.Group>(null);
//   const { level, beatTick } = useAudioPulse(0.92);
//   const rings = useRef<Array<{ born: number; life: number; mesh: THREE.Mesh }>>([]);
//   const lastBeat = useRef(0);

//   useEffect(() => {
//     rings.current = [];
//   }, []);

//   useFrame(({ clock }) => {
//     if (reduceMotion) return;
//     const t = clock.getElapsedTime();

//     // spawn on beat
//     if (lastBeat.current !== beatTick) {
//       lastBeat.current = beatTick;
//       if (group.current) {
//         const mesh = new THREE.Mesh(
//           new THREE.RingGeometry(0.05, 0.052, 48),
//           new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, color: 0xffffff })
//         );
//         mesh.position.set(0.55 + (Math.random() - 0.5) * 0.4, -0.02 + (Math.random() - 0.5) * 0.25, -0.6);
//         group.current.add(mesh);
//         rings.current.push({ born: t, life: 0.9, mesh });
//         // ניקוי עודף
//         if (rings.current.length > 12) {
//           const old = rings.current.shift();
//           old?.mesh.geometry.dispose();
//           (old?.mesh.material as THREE.Material)?.dispose();
//           old && group.current?.remove(old.mesh);
//         }
//       }
//     }

//     // update
//     rings.current.forEach((r) => {
//       const age = t - r.born;
//       const k = THREE.MathUtils.clamp(age / r.life, 0, 1);
//       const s = 1 + k * 2.4;
//       r.mesh.scale.setScalar(s);
//       const mat = r.mesh.material as THREE.MeshBasicMaterial;
//       mat.opacity = (1 - k) * 0.55;
//     });
//     // remove dead
//     const keep: typeof rings.current = [];
//     rings.current.forEach((r) => {
//       if (t - r.born < r.life) keep.push(r);
//       else {
//         r.mesh.geometry.dispose();
//         (r.mesh.material as THREE.Material).dispose();
//         group.current?.remove(r.mesh);
//       }
//     });
//     rings.current = keep;
//   });

//   return <group ref={group} />;
// }

// /* ============================================================
//    QuadScene — מטעינה את ארבעת האווטארים + רקע חלקיקים
//    ============================================================ */
// function QuadScene({
//   mouse,
//   focusIdx,
//   reduceMotion,
//   quality,
// }: {
//   mouse: THREE.Vector2;
//   focusIdx: number;
//   reduceMotion: boolean;
//   quality: number; // 0.5..1
// }) {
//   const urls = [
//     useSmartUrl(CATEGORIES[0].imgs),
//     useSmartUrl(CATEGORIES[1].imgs),
//     useSmartUrl(CATEGORIES[2].imgs),
//     useSmartUrl(CATEGORIES[3].imgs),
//   ];
//   const ready = urls.every(Boolean);

//   return (
//     <Suspense fallback={<SceneLoader />}>
//       {/* חלקיקים עדינים */}
//       <ParticleField reduceMotion={reduceMotion} quality={quality} />

//       {/* האווטארים */}
//       {ready &&
//         urls.map((u, i) => (
//           <AvatarPlane
//             key={u as string}
//             url={u as string}
//             mouse={mouse}
//             base={[LAYOUT[i][0], LAYOUT[i][1]]}
//             depth={LAYOUT[i][2]}
//             phase={i * 0.7}
//             focus={i === focusIdx ? 1 : 0.55}
//             reduceMotion={reduceMotion}
//             reactToBeat
//             quality={quality}
//           />
//         ))}

//       {/* ריפלים לפי ביט */}
//       <BeatRipples reduceMotion={reduceMotion} />

//       <Preload all />
//     </Suspense>
//   );
// }

// /* ============================================================
//    קטגוריות (כפתורי טאבים) — עם נגישות
//    ============================================================ */
// function CategoryChips({
//   active,
//   onChange,
// }: {
//   active: CategoryKey;
//   onChange: (k: CategoryKey) => void;
// }) {
//   return (
//     <div
//       role="tablist"
//       aria-label="בחירת וייב"
//       className="flex flex-wrap gap-2"
//       dir="rtl"
//     >
//       {CATEGORIES.map((c) => {
//         const selected = c.key === active;
//         return (
//           <button
//             key={c.key}
//             role="tab"
//             aria-selected={selected}
//             aria-controls={`panel-${c.key}`}
//             onClick={() => onChange(c.key)}
//             className={[
//               "px-3 py-1.5 rounded-full text-sm border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
//               selected
//                 ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
//                 : "bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800",
//             ].join(" ")}
//           >
//             {c.label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// /* ============================================================
//    Hero3D — קומפוננטה ראשית
//    ============================================================ */
// export default function Hero3D() {
//   const [activeKey, setActiveKey] = useState<CategoryKey>("mizrahi");
//   const focusIdx = useMemo(() => Math.max(0, CATEGORIES.findIndex((c) => c.key === activeKey)), [activeKey]);

//   const reduceMotion = useReducedMotion() || false;

//   const [hover, setHover] = useState(false);
//   const [cursor, setCursor] = useState({ x: 0, y: 0 });

//   const mouse = useRef(new THREE.Vector2(0, 0));
//   const boxRef = useRef<HTMLDivElement>(null);

//   // Throttle עם rAF
//   const rafRef = useRef<number | null>(null);
//   const last = useRef<{ x: number; y: number } | null>(null);

//   const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
//     if (!boxRef.current) return;
//     const rect = boxRef.current.getBoundingClientRect();
//     last.current = {
//       x: (e.clientX - rect.left) / rect.width,
//       y: (e.clientY - rect.top) / rect.height,
//     };
//     if (rafRef.current == null) {
//       rafRef.current = requestAnimationFrame(() => {
//         rafRef.current = null;
//         const v = last.current;
//         if (!v) return;
//         mouse.current.set(v.x * 2 - 1, v.y * 2 - 1);
//         setCursor({ x: v.x * rect.width, y: v.y * rect.height });
//       });
//     }
//   }, []);

//   useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

//   const activeCat = CATEGORIES[focusIdx] ?? CATEGORIES[0];

//   // Pause/Resume סצנה כאשר מחוץ למסך
//   const sceneContainerRef = useRef<HTMLDivElement>(null);
//   const inView = useInView(sceneContainerRef, { margin: "-20% 0px -20% 0px", once: false });

//   // DPR/איכות אדפטיביים
//   const [dpr, setDpr] = useState<[number, number]>([1, 1.8]);
//   const [quality, setQuality] = useState(1);

//   return (
//     <section
//       className="relative"
//       style={{
//         backgroundImage:
//           "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 1px)",
//         backgroundSize: "18px 18px",
//       }}
//     >
//       <div className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-10 max-w-6xl mx-auto px-4 py-12">
//         {/* טקסט/CTA */}
//         <div className="order-2 md:order-1 text-right">
//           <motion.h1
//             id={`panel-${activeCat.key}`}
//             className="text-3xl md:text-5xl font-extrabold tracking-tight"
//             initial={{ opacity: 0, y: 14 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true, amount: 0.6 }}
//             transition={{ type: "spring", stiffness: 120, damping: 16 }}
//           >
//             {activeCat.headline}
//           </motion.h1>

//           <motion.p
//             className="mt-3 opacity-80 leading-relaxed text-[15px]"
//             initial={{ opacity: 0 }}
//             whileInView={{ opacity: 1 }}
//             viewport={{ once: true, amount: 0.6 }}
//             transition={{ duration: 0.45, delay: 0.05 }}
//           >
//             {activeCat.blurb}
//           </motion.p>

//           <div className="mt-6">
//             <CategoryChips active={activeKey} onChange={(k) => setActiveKey(k)} />
//           </div>

//           <div className="mt-6 flex flex-wrap gap-2 justify-end">
//             <a
//               href="/book"
//               className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
//             >
//               הזמנת הופעה
//             </a>
//             <a
//               href="/playlists"
//               className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
//             >
//               פלייליסטים
//             </a>
//           </div>
//         </div>

//         {/* סצנת ה-3D */}
//         <motion.div
//           ref={boxRef}
//           className="order-1 md:order-2 relative h-[360px] md:h-[480px] rounded-2xl overflow-visible"
//           style={{ perspective: 1000, transformStyle: "preserve-3d" }}
//           initial={{ opacity: 0, x: 24 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true, amount: 0.4 }}
//           transition={{ type: "spring", stiffness: 120, damping: 18 }}
//           onPointerMove={onPointerMove}
//           onPointerEnter={() => setHover(true)}
//           onPointerLeave={() => setHover(false)}
//           ref={sceneContainerRef}
//         >
//           <Canvas
//             className="pointer-events-none absolute inset-0"
//             dpr={dpr}
//             camera={{ position: [0, 0.7, 2.2], fov: 35 }}
//             gl={{ antialias: true, alpha: true }}
//             // כאשר לא בפריים — נעצור פריימים כדי לחסוך משאבים
//             frameloop={inView ? "always" : "never"}
//             onCreated={({ gl }) => {
//               if ("outputColorSpace" in gl && (THREE as any).SRGBColorSpace) {
//                 (gl as any).outputColorSpace = (THREE as any).SRGBColorSpace;
//               } else if ("outputEncoding" in gl && (THREE as any).sRGBEncoding) {
//                 (gl as any).outputEncoding = (THREE as any).sRGBEncoding;
//               }
//             }}
//           >
//             {/* אדפטציית ביצועים: אם FPS יורד — נוריד DPR ואיכות */}
//             <PerformanceMonitor
//               onDecline={() => {
//                 setDpr([1, 1.4]);
//                 setQuality((q) => Math.max(0.7, q - 0.1));
//               }}
//               onIncline={() => {
//                 setDpr([1, 1.8]);
//                 setQuality((q) => Math.min(1, q + 0.05));
//               }}
//               ms={250}
//               bounds={(n) => Math.max(30, Math.min(120, n))}
//             />

//             <QuadScene
//               mouse={mouse.current}
//               focusIdx={focusIdx}
//               reduceMotion={!!reduceMotion}
//               quality={quality}
//             />
//           </Canvas>

//           {/* אפקט גלואו לעכבר */}
//           <AnimatePresence>
//             {hover && !reduceMotion && (
//               <motion.div
//                 key="cursor-glow"
//                 className="pointer-events-none absolute z-10 h-8 w-8 rounded-full blur-lg"
//                 style={{
//                   background:
//                     "radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
//                   left: 0,
//                   top: 0,
//                 }}
//                 initial={{ opacity: 0, scale: 0.8 }}
//                 animate={{ opacity: 0.8, scale: 1, x: cursor.x - 16, y: cursor.y - 16 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ type: "spring", stiffness: 250, damping: 24 }}
//               />
//             )}
//           </AnimatePresence>

//           <div className="absolute inset-0 rounded-2xl border border-black/10 dark:border-white/10 pointer-events-none" />
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// /* ============================================================
//    טיפ: הוסף פעם אחת ב-<head> פרה-קונקט/פרה-לוד לתמונות
//    (ב-layout.tsx בתוך <head> או עם next/head מקום אחר)
//    <link rel="preconnect" href="/" />
//    <link rel="preload" as="image" href="/assets/images/avatar-chabad.png" />
//    ...
//    ============================================================ */

//================================================================================================================

// "use client";

// import {
//   useRef,
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
//   Suspense,
//   memo,
//   startTransition,
// } from "react";
// import {
//   motion,
//   AnimatePresence,
//   useReducedMotion,
//   useInView,
// } from "framer-motion";
// import dynamic from "next/dynamic";
// import * as THREE from "three";
// import { useFrame, useThree } from "@react-three/fiber";
// import {
//   Preload,
//   Html,
//   useProgress,
//   PerformanceMonitor,
// } from "@react-three/drei";
// import { useAudioPulse } from "@/hooks/useAudioPulse";
// import { useAudioBands } from "@/hooks/useAudioBands";

// /** Canvas ללא SSR כדי למנוע hydration mismatch */
// const Canvas = dynamic(
//   () => import("@react-three/fiber").then((m) => m.Canvas),
//   { ssr: false },
// );

// type CategoryKey = "chabad" | "mizrahi" | "soft" | "fun";
// type Cat = {
//   key: CategoryKey;
//   label: string;
//   imgs: string[];
//   headline: string;
//   blurb: string;
// };

// const CATEGORIES: Cat[] = [
//   {
//     key: "chabad",
//     label: "חסידי (חב״ד)",
//     imgs: ["/assets/images/avatar-chabad.png"],
//     headline: "ניגונים שמרימים את הנפש",
//     blurb: "חום של התוועדות, ביטים מודרניים ונשמה חסידית.",
//   },
//   {
//     key: "mizrahi",
//     label: "מזרחי",
//     imgs: ["/assets/images/avatar-mizrahi.png"],
//     headline: "ים־תיכוני בועט",
//     blurb: "גרוב של חאפלה, כינורות ותופים שמזיזים את הרחבה.",
//   },
//   {
//     key: "soft",
//     label: "שקט",
//     imgs: ["/assets/images/avatar-soft.png"],
//     headline: "שירים לנשימה עמוקה",
//     blurb: "בלדות עדינות, צליל נקי ורוגע אחרי יום ארוך.",
//   },
//   {
//     key: "fun",
//     label: "מקפיץ",
//     imgs: ["/assets/images/avatar-fun.png"],
//     headline: "בוסט של אנרגיה",
//     blurb: "ביטים חדים, הוקים קליטים ואווירת מסיבה.",
//   },
// ];

// /** פריסת מיקום/עומק (x,y,z) */
// const LAYOUT: ReadonlyArray<[number, number, number]> = [
//   [0.35, 0.16, 0.0],
//   [0.72, -0.04, 0.12],
//   [0.24, -0.26, 0.28],
//   [0.94, 0.08, 0.42],
// ];

// /* ============================================================
//    טעינה חכמה של תמונות עם createImageBitmap + cache בזיכרון
//    ============================================================ */

// const bitmapCache = new Map<string, THREE.Texture>();
// const pendingCache = new Map<string, Promise<THREE.Texture>>();

// async function loadBitmapTexture(url: string): Promise<THREE.Texture> {
//   if (bitmapCache.has(url)) return bitmapCache.get(url)!;
//   if (pendingCache.has(url)) return pendingCache.get(url)!;

//   const job = (async () => {
//     try {
//       const resp = await fetch(url, {
//         mode: "cors",
//         credentials: "omit",
//         cache: "force-cache",
//       });
//       const blob = await resp.blob();
//       const bmp = await createImageBitmap(blob, {
//         colorSpaceConversion: "default",
//         premultiplyAlpha: "none" as any,
//       });
//       const tex = new THREE.Texture(bmp);
//       (tex as any).colorSpace =
//         (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding;
//       tex.anisotropy = 8;
//       tex.generateMipmaps = true;
//       tex.minFilter = THREE.LinearMipmapLinearFilter;
//       tex.magFilter = THREE.LinearFilter;
//       tex.needsUpdate = true;
//       bitmapCache.set(url, tex);
//       return tex;
//     } catch {
//       const loader = new THREE.TextureLoader();
//       return await new Promise<THREE.Texture>((resolve, reject) => {
//         loader.setCrossOrigin("anonymous");
//         loader.load(
//           url,
//           (tex) => {
//             if ("colorSpace" in tex)
//               (tex as any).colorSpace =
//                 (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding;
//             tex.anisotropy = 8;
//             tex.generateMipmaps = true;
//             tex.minFilter = THREE.LinearMipmapLinearFilter;
//             tex.magFilter = THREE.LinearFilter;
//             tex.needsUpdate = true;
//             bitmapCache.set(url, tex);
//             resolve(tex);
//           },
//           undefined,
//           reject,
//         );
//       });
//     }
//   })();

//   pendingCache.set(url, job);
//   try {
//     return await job;
//   } finally {
//     pendingCache.delete(url);
//   }
// }

// /* ============================================================
//    useSmartUrl — בוחר URL תקין ראשון + Preload hint
//    ============================================================ */
// function useSmartUrl(candidates: string[]) {
//   const [url, setUrl] = useState<string | null>(null);
//   useEffect(() => {
//     let alive = true;

//     candidates.forEach((u) => {
//       const l = document.createElement("link");
//       l.rel = "preload";
//       l.as = "image";
//       l.href = u;
//       document.head.appendChild(l);
//       setTimeout(() => l.remove(), 4000);
//     });

//     (async () => {
//       for (const u of candidates) {
//         const ok = await new Promise<boolean>((res) => {
//           const img = new Image();
//           img.decoding = "async";
//           img.loading = "eager";
//           img.crossOrigin = "anonymous";
//           img.onload = () => res(true);
//           img.onerror = () => res(false);
//           img.src = u;
//         });
//         if (!alive) return;
//         if (ok) {
//           setUrl(u);
//           break;
//         }
//       }
//     })();

//     return () => {
//       alive = false;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [candidates.join("|")]);

//   return url;
// }

// /* ============================================================
//    Loader מינימלי (useProgress)
//    ============================================================ */
// const SceneLoader = memo(function SceneLoader() {
//   const { progress, active } = useProgress();
//   const pct = Math.floor(progress);
//   return (
//     <Html center style={{ pointerEvents: "none" }}>
//       <div
//         dir="rtl"
//         className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur px-4 py-2 text-sm shadow-lg"
//       >
//         {active ? (
//           <div className="flex items-center gap-2">
//             <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-black/70 dark:bg-white/70" />
//             <span>טוען סצנה… {pct}%</span>
//           </div>
//         ) : (
//           <span>מוכן ✓</span>
//         )}
//       </div>
//     </Html>
//   );
// });

// /* ============================================================
//    AvatarPlane — טינט דינמי + beat/pulse + progressive texture
//    ============================================================ */
// function AvatarPlane({
//   url,
//   base,
//   mouse,
//   phase = 0,
//   depth = 0,
//   focus = 0.6,
//   reduceMotion = false,
//   reactToBeat = true,
//   quality = 1,
// }: {
//   url: string;
//   base: [number, number];
//   mouse: THREE.Vector2;
//   phase?: number;
//   depth?: number;
//   focus?: number;
//   reduceMotion?: boolean;
//   reactToBeat?: boolean;
//   quality?: number; // 0.5..1
// }) {
//   const matRef = useRef<THREE.MeshBasicMaterial>(null);
//   const g = useRef<THREE.Group>(null);
//   const [size, setSize] = useState<[number, number] | null>(null);
//   const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
//   const tint = useRef(new THREE.Color(0xffffff));

//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       const tex = await loadBitmapTexture(url);
//       if (!alive) return;
//       tex.anisotropy = Math.max(4, Math.min(16, (maxAniso || 16) * quality));
//       tex.needsUpdate = true;
//       const img: any = tex.image;
//       setSize([img?.width ?? 1, img?.height ?? 1]);
//       startTransition(() => {
//         matRef.current?.setValues({ map: tex, opacity: 0.85 });
//         if (matRef.current) matRef.current.needsUpdate = true;
//       });
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [url, maxAniso, quality]);

//   const baseH = 1.32;
//   const planeW = useMemo(() => {
//     if (!size) return baseH;
//     const [w, h] = size;
//     return baseH * (w / h);
//   }, [size]);

//   // אודיו
//   const { level, beatTick } = useAudioPulse(0.9);
//   const lastBeat = useRef(0);
//   const beatBoost = useRef(0); // 0..1

//   const { bass, treble } = useAudioBands(0.88);
//   const bandsRef = useRef({ bass: 0, treble: 0 });
//   useEffect(() => {
//     bandsRef.current = { bass, treble };
//   }, [bass, treble]);

//   useFrame(({ clock }) => {
//     if (!g.current) return;
//     const t = clock.getElapsedTime() + phase;

//     const mx = THREE.MathUtils.clamp(mouse.x, -0.8, 0.8);
//     const my = THREE.MathUtils.clamp(mouse.y, -0.8, 0.8);
//     const parallaxX = reduceMotion ? 0 : mx * (0.1 + depth * 0.04);
//     const parallaxY = reduceMotion ? 0 : -my * (0.07 + depth * 0.03);

//     if (reactToBeat && lastBeat.current !== beatTick) {
//       lastBeat.current = beatTick;
//       beatBoost.current = 1;
//     }
//     beatBoost.current = Math.max(0, beatBoost.current * 0.86);

//     const bobY = reduceMotion ? 0 : Math.sin(t * (1.1 + depth * 0.15)) * 0.05;
//     const rotY = reduceMotion ? 0 : Math.sin(t * 0.9) * (0.05 + depth * 0.02);
//     const rotX = reduceMotion ? 0 : Math.cos(t * 1.2) * (0.04 + depth * 0.02);

//     const targetOpacity = 0.25 + 0.75 * focus;
//     const focusScale = 1 + 0.09 * (focus - 0.6);

//     if (matRef.current) {
//       matRef.current.opacity = THREE.MathUtils.lerp(
//         matRef.current.opacity ?? 1,
//         targetOpacity,
//         0.15,
//       );
//     }

//     g.current.position.set(
//       base[0] + parallaxX,
//       base[1] + bobY + parallaxY,
//       -depth,
//     );

//     const dance = reduceMotion ? 0 : level * 0.11 + beatBoost.current * 0.15;
//     g.current.rotation.set(rotX + dance * 0.02, rotY - dance * 0.02, 0);

//     const breathe = reduceMotion ? 1 : 1 + Math.sin(t * 1.6) * 0.012;
//     const pulse = reduceMotion
//       ? 1
//       : breathe + level * 0.05 + beatBoost.current * 0.06;
//     g.current.scale.set(pulse * focusScale, pulse * focusScale, 1);

//     g.current.position.y += reduceMotion ? 0 : beatBoost.current * 0.06;

//     if (!reduceMotion && matRef.current) {
//       const { bass: b, treble: tr } = bandsRef.current;
//       const mix = b / (b + tr + 1e-4); // 0..1
//       const hue = 260 - 220 * mix; // 260→40
//       const sat = THREE.MathUtils.clamp(
//         0.25 + Math.max(b, tr) * 0.6,
//         0.25,
//         0.9,
//       );
//       const light = 0.95;
//       tint.current.setHSL(hue / 360, sat, light);
//       matRef.current.color.lerp(tint.current, 0.15);
//     }
//   });

//   return (
//     <group ref={g}>
//       {!reduceMotion && (
//         <mesh position={[0, -0.02, -0.0001]}>
//           <planeGeometry args={[planeW * 0.9, baseH * 0.28]} />
//           <meshBasicMaterial transparent opacity={0.18} color="#000" />
//         </mesh>
//       )}

//       <mesh>
//         <planeGeometry args={[planeW, baseH]} />
//         <meshBasicMaterial
//           ref={matRef}
//           transparent
//           alphaTest={0.05}
//           color="white"
//           opacity={0.8}
//         />
//       </mesh>
//     </group>
//   );
// }

// /* ============================================================
//    ParticleField — InstancedMesh קליל
//    ============================================================ */
// const ParticleField = memo(function ParticleField({
//   count = 160,
//   area = [1.8, 1.2],
//   depth = 1.2,
//   reduceMotion = false,
//   quality = 1,
// }: {
//   count?: number;
//   area?: [number, number];
//   depth?: number;
//   reduceMotion?: boolean;
//   quality?: number;
// }) {
//   const ref = useRef<THREE.InstancedMesh>(null);
//   const dummy = useMemo(() => new THREE.Object3D(), []);
//   const speeds = useMemo(
//     () => Float32Array.from({ length: count }, () => 0.1 + Math.random() * 0.6),
//     [count],
//   );
//   const offsets = useMemo(
//     () =>
//       Float32Array.from({ length: count }, () => Math.random() * Math.PI * 2),
//     [count],
//   );

//   useEffect(() => {
//     if (!ref.current) return;
//     for (let i = 0; i < count; i++) {
//       const x = (Math.random() - 0.5) * area[0];
//       const y = (Math.random() - 0.5) * area[1];
//       const z = -Math.random() * depth;
//       dummy.position.set(x, y, z);
//       const s =
//         (reduceMotion ? 0.004 : 0.006) * (0.6 + Math.random() * 0.8) * quality;
//       dummy.scale.setScalar(s);
//       dummy.rotation.z = Math.random() * Math.PI;
//       dummy.updateMatrix();
//       ref.current.setMatrixAt(i, dummy.matrix);
//     }
//     ref.current.instanceMatrix.needsUpdate = true;
//   }, [count, area, depth, dummy, reduceMotion, quality]);

//   useFrame((_, dt) => {
//     if (!ref.current || reduceMotion) return;
//     const m = new THREE.Matrix4();
//     const p = new THREE.Vector3();
//     for (let i = 0; i < count; i++) {
//       ref.current.getMatrixAt(i, m);
//       p.setFromMatrixPosition(m);
//       const s = speeds[i] * 0.04 * (quality * 0.9 + 0.1);
//       p.y += Math.sin(offsets[i] + performance.now() * 0.0006) * s * 0.2;
//       p.x += Math.cos(offsets[i] + performance.now() * 0.0004) * s * 0.15;
//       if (p.y > area[1] * 0.6) p.y = -area[1] * 0.6;
//       if (p.x > area[0] * 0.6) p.x = -area[0] * 0.6;
//       dummy.position.copy(p);
//       dummy.updateMatrix();
//       ref.current.setMatrixAt(i, dummy.matrix);
//     }
//     ref.current.instanceMatrix.needsUpdate = true;
//   });

//   return (
//     <instancedMesh ref={ref} args={[undefined as any, undefined as any, count]}>
//       <planeGeometry args={[1, 1]} />
//       <meshBasicMaterial transparent opacity={0.1} color="#ffffff" />
//     </instancedMesh>
//   );
// });

// /* ============================================================
//    BeatRipples — טבעות על ביט
//    ============================================================ */
// function BeatRipples({ reduceMotion = false }: { reduceMotion?: boolean }) {
//   const group = useRef<THREE.Group>(null);
//   const { beatTick } = useAudioPulse(0.92);
//   const rings = useRef<Array<{ born: number; life: number; mesh: THREE.Mesh }>>(
//     [],
//   );
//   const lastBeat = useRef(0);

//   useEffect(() => {
//     rings.current = [];
//   }, []);

//   useFrame(({ clock }) => {
//     if (reduceMotion) return;
//     const t = clock.getElapsedTime();

//     if (lastBeat.current !== beatTick) {
//       lastBeat.current = beatTick;
//       if (group.current) {
//         const mesh = new THREE.Mesh(
//           new THREE.RingGeometry(0.05, 0.052, 48),
//           new THREE.MeshBasicMaterial({
//             transparent: true,
//             opacity: 0.55,
//             color: 0xffffff,
//           }),
//         );
//         mesh.position.set(
//           0.55 + (Math.random() - 0.5) * 0.4,
//           -0.02 + (Math.random() - 0.5) * 0.25,
//           -0.6,
//         );
//         group.current.add(mesh);
//         rings.current.push({ born: t, life: 0.9, mesh });
//         if (rings.current.length > 12) {
//           const old = rings.current.shift();
//           old?.mesh.geometry.dispose();
//           (old?.mesh.material as THREE.Material)?.dispose();
//           old && group.current?.remove(old.mesh);
//         }
//       }
//     }

//     const keep: typeof rings.current = [];
//     rings.current.forEach((r) => {
//       const k = THREE.MathUtils.clamp((t - r.born) / r.life, 0, 1);
//       r.mesh.scale.setScalar(1 + k * 2.4);
//       const mat = r.mesh.material as THREE.MeshBasicMaterial;
//       mat.opacity = (1 - k) * 0.55;
//       if (t - r.born < r.life) keep.push(r);
//       else {
//         r.mesh.geometry.dispose();
//         (r.mesh.material as THREE.Material).dispose();
//         group.current?.remove(r.mesh);
//       }
//     });
//     rings.current = keep;
//   });

//   return <group ref={group} />;
// }

// /* ============================================================
//    QuadScene — ארבעת האווטארים + רקע חלקיקים
//    ============================================================ */
// function QuadScene({
//   mouse,
//   focusIdx,
//   reduceMotion,
//   quality,
// }: {
//   mouse: THREE.Vector2;
//   focusIdx: number;
//   reduceMotion: boolean;
//   quality: number;
// }) {
//   const urls = [
//     useSmartUrl(CATEGORIES[0].imgs),
//     useSmartUrl(CATEGORIES[1].imgs),
//     useSmartUrl(CATEGORIES[2].imgs),
//     useSmartUrl(CATEGORIES[3].imgs),
//   ];
//   const ready = urls.every(Boolean);

//   return (
//     <Suspense fallback={<SceneLoader />}>
//       <ParticleField reduceMotion={reduceMotion} quality={quality} />
//       {ready &&
//         urls.map((u, i) => (
//           <AvatarPlane
//             key={u as string}
//             url={u as string}
//             mouse={mouse}
//             base={[LAYOUT[i][0], LAYOUT[i][1]]}
//             depth={LAYOUT[i][2]}
//             phase={i * 0.7}
//             focus={i === focusIdx ? 1 : 0.55}
//             reduceMotion={reduceMotion}
//             reactToBeat
//             quality={quality}
//           />
//         ))}
//       <BeatRipples reduceMotion={reduceMotion} />
//       <Preload all />
//     </Suspense>
//   );
// }

// /* ============================================================
//    קטגוריות (כפתורי טאבים)
//    ============================================================ */
// function CategoryChips({
//   active,
//   onChange,
// }: {
//   active: CategoryKey;
//   onChange: (k: CategoryKey) => void;
// }) {
//   return (
//     <div
//       role="tablist"
//       aria-label="בחירת וייב"
//       className="flex flex-wrap gap-2"
//       dir="rtl"
//     >
//       {CATEGORIES.map((c) => {
//         const selected = c.key === active;
//         return (
//           <button
//             key={c.key}
//             role="tab"
//             aria-selected={selected}
//             aria-controls={`panel-${c.key}`}
//             onClick={() => onChange(c.key)}
//             className={[
//               "px-3 py-1.5 rounded-full text-sm border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
//               selected
//                 ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
//                 : "bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800",
//             ].join(" ")}
//           >
//             {c.label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// /* ============================================================
//    Hero3D — ראשי
//    ============================================================ */
// export default function Hero3D() {
//   const [activeKey, setActiveKey] = useState<CategoryKey>("mizrahi");
//   const focusIdx = useMemo(
//     () =>
//       Math.max(
//         0,
//         CATEGORIES.findIndex((c) => c.key === activeKey),
//       ),
//     [activeKey],
//   );

//   const reduceMotion = useReducedMotion() || false;

//   const [hover, setHover] = useState(false);
//   const [cursor, setCursor] = useState({ x: 0, y: 0 });

//   const mouse = useRef(new THREE.Vector2(0, 0));
//   const boxRef = useRef<HTMLDivElement>(null);
//   const sceneContainerRef = useRef<HTMLDivElement>(null);

//   // *** חשוב: ref מאוחד לאותו אלמנט (מנע דריסה של ref קודם) ***
//   const setSceneRefs = useCallback((el: HTMLDivElement | null) => {
//     boxRef.current = el;
//     sceneContainerRef.current = el;
//   }, []);

//   // Throttle עם rAF
//   const rafRef = useRef<number | null>(null);
//   const last = useRef<{ x: number; y: number } | null>(null);

//   const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
//     if (!boxRef.current) return;
//     const rect = boxRef.current.getBoundingClientRect();
//     last.current = {
//       x: (e.clientX - rect.left) / rect.width,
//       y: (e.clientY - rect.top) / rect.height,
//     };
//     if (rafRef.current == null) {
//       rafRef.current = requestAnimationFrame(() => {
//         rafRef.current = null;
//         const v = last.current;
//         if (!v) return;
//         mouse.current.set(v.x * 2 - 1, v.y * 2 - 1);
//         setCursor({ x: v.x * rect.width, y: v.y * rect.height });
//       });
//     }
//   }, []);

//   useEffect(
//     () => () => {
//       if (rafRef.current) cancelAnimationFrame(rafRef.current);
//     },
//     [],
//   );

//   const activeCat = CATEGORIES[focusIdx] ?? CATEGORIES[0];

//   // Pause/Resume סצנה כאשר מחוץ למסך
//   const inView = useInView(sceneContainerRef, {
//     margin: "-20% 0px -20% 0px",
//     once: false,
//   });

//   // DPR/איכות אדפטיביים
//   const [dpr, setDpr] = useState<[number, number]>([1, 1.8]);
//   const [quality, setQuality] = useState(1);

//   // Tilt עדין לכל הכרטיס
//   const tilt = hover
//     ? {
//         rotateX:
//           -((cursor.y / (boxRef.current?.clientHeight || 1)) * 4 - 2) || 0,
//         rotateY: (cursor.x / (boxRef.current?.clientWidth || 1)) * 6 - 3 || 0,
//       }
//     : { rotateX: 0, rotateY: 0 };

//   return (
//     <section
//       className="relative"
//       style={{
//         background:
//           "radial-gradient(800px 400px at 90% -10%, rgba(124,92,255,.12), transparent 60%), radial-gradient(600px 320px at 10% 120%, rgba(198,91,255,.10), transparent 60%)",
//       }}
//     >
//       <div className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-10 max-w-6xl mx-auto px-4 py-12">
//         {/* טקסט/CTA */}
//         <div className="order-2 md:order-1 text-right">
//           <motion.h1
//             id={`panel-${activeCat.key}`}
//             className="text-3xl md:text-5xl font-extrabold tracking-tight"
//             initial={{ opacity: 0, y: 14 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true, amount: 0.6 }}
//             transition={{ type: "spring", stiffness: 120, damping: 16 }}
//           >
//             {activeCat.headline}
//           </motion.h1>

//           <motion.p
//             className="mt-3 opacity-80 leading-relaxed text-[15px]"
//             initial={{ opacity: 0 }}
//             whileInView={{ opacity: 1 }}
//             viewport={{ once: true, amount: 0.6 }}
//             transition={{ duration: 0.45, delay: 0.05 }}
//           >
//             {activeCat.blurb}
//           </motion.p>

//           <div className="mt-6">
//             <CategoryChips active={activeKey} onChange={setActiveKey} />
//           </div>

//           <div className="mt-6 flex flex-wrap gap-2 justify-end">
//             <a
//               href="/book"
//               className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
//             >
//               הזמנת הופעה
//             </a>
//             <a
//               href="/playlists"
//               className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
//             >
//               פלייליסטים
//             </a>
//           </div>
//         </div>

//         {/* סצנת ה-3D */}
//         <motion.div
//           ref={setSceneRefs}
//           className="order-1 md:order-2 relative h-[360px] md:h-[480px] rounded-2xl overflow-visible"
//           style={{ perspective: 1000, transformStyle: "preserve-3d" }}
//           initial={{ opacity: 0, x: 24 }}
//           whileInView={{ opacity: 1, x: 0 }}
//           viewport={{ once: true, amount: 0.4 }}
//           transition={{ type: "spring", stiffness: 120, damping: 18 }}
//           onPointerMove={onPointerMove}
//           onPointerEnter={() => setHover(true)}
//           onPointerLeave={() => setHover(false)}
//           onTouchStart={() => setHover(true)}
//           onTouchEnd={() => setHover(false)}
//           animate={tilt}
//         >
//           {/* עוטף עם מסכה עגולה אמיתית כדי לבטל “שפיצים” */}
//           <div
//             className="absolute inset-0 rounded-2xl mm-rounded-mask overflow-hidden"
//             aria-hidden
//           >
//             <Canvas
//               className="pointer-events-none absolute inset-0"
//               dpr={dpr}
//               camera={{ position: [0, 0.7, 2.2], fov: 35 }}
//               gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
//               frameloop={inView ? "always" : "never"}
//               onCreated={({ gl }) => {
//                 if ("outputColorSpace" in gl && (THREE as any).SRGBColorSpace) {
//                   (gl as any).outputColorSpace = (THREE as any).SRGBColorSpace;
//                 } else if (
//                   "outputEncoding" in gl &&
//                   (THREE as any).sRGBEncoding
//                 ) {
//                   (gl as any).outputEncoding = (THREE as any).sRGBEncoding;
//                 }
//               }}
//             >
//               <PerformanceMonitor
//                 onDecline={() => {
//                   setDpr([1, 1.4]);
//                   setQuality((q) => Math.max(0.7, q - 0.1));
//                 }}
//                 onIncline={() => {
//                   setDpr([1, 1.8]);
//                   setQuality((q) => Math.min(1, q + 0.05));
//                 }}
//                 ms={250}
//                 bounds={(n) => Math.max(30, Math.min(120, n))}
//               />
//               <QuadScene
//                 mouse={mouse.current}
//                 focusIdx={focusIdx}
//                 reduceMotion={!!reduceMotion}
//                 quality={quality}
//               />
//             </Canvas>
//           </div>

//           {/* אפקט גלואו לעכבר */}
//           <AnimatePresence>
//             {hover && !reduceMotion && (
//               <motion.div
//                 key="cursor-glow"
//                 className="pointer-events-none absolute z-10 h-8 w-8 rounded-full blur-lg"
//                 style={{
//                   background:
//                     "radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
//                   left: 0,
//                   top: 0,
//                 }}
//                 initial={{ opacity: 0, scale: 0.8 }}
//                 animate={{
//                   opacity: 0.8,
//                   scale: 1,
//                   x: cursor.x - 16,
//                   y: cursor.y - 16,
//                 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ type: "spring", stiffness: 250, damping: 24 }}
//               />
//             )}
//           </AnimatePresence>

//           {/* מסגרת דקה מעל המסכה */}
//           <div className="absolute inset-0 rounded-2xl border border-black/10 dark:border-white/10 pointer-events-none" />
//         </motion.div>
//       </div>
//     </section>
//   );
// }

// /* ============================================================
//    טיפ: הוסף פעם אחת ב-<head> פרה-קונקט/פרה-לוד לתמונות
//    <link rel="preconnect" href="/" />
//    <link rel="preload" as="image" href="/assets/images/avatar-chabad.png" />
//    ...
//    ============================================================ */

"use client";

import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useInView,
} from "framer-motion";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Preload,
  Html,
  useProgress,
  PerformanceMonitor,
} from "@react-three/drei";

/** Canvas ללא SSR כדי למנוע hydration mismatch */
const Canvas = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  { ssr: false },
);

// אם ההוקים שלך קיימים — הייבוא יעבוד. אם לא, יש לנו shim מקומי שלא ישבור build.
let useAudioPulse: (smooth?: number) => { level: number; beatTick: number };
let useAudioBands: (smooth?: number) => {
  bass: number;
  mid?: number;
  treble: number;
};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useAudioPulse = require("@/hooks/useAudioPulse").useAudioPulse;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useAudioBands = require("@/hooks/useAudioBands").useAudioBands;
} catch {
  // 🔁 Fallback פשוט כדי שלא ייפול build אם ההוקים לא קיימים עדיין
  useAudioPulse = () => ({ level: 0, beatTick: 0 });
  useAudioBands = () => ({ bass: 0, treble: 0 });
}

// ===================== סוגים ותוכן =====================
type CategoryKey = "chabad" | "mizrahi" | "soft" | "fun";

type Cat = {
  key: CategoryKey;
  label: string;
  imgs: string[]; // נקודות לתמונות בתוך public/
  headline: string;
  blurb: string;
};

export const CATEGORIES: Cat[] = [
  {
    key: "chabad",
    label: "חסידי (חב״ד)",
    imgs: ["/assets/images/avatar-chabad.png", "/logo/mg-mark.svg"],
    headline: "ניגונים שמרימים את הנפש",
    blurb: "חום של התוועדות, ביטים מודרניים ונשמה חסידית.",
  },
  {
    key: "mizrahi",
    label: "מזרחי",
    imgs: ["/assets/images/avatar-mizrahi.png", "/logo/mg-mark.svg"],
    headline: "ים־תיכוני בועט",
    blurb: "גרוב של חאפלה, כינורות ותופים שמזיזים את הרחבה.",
  },
  {
    key: "soft",
    label: "שקט",
    imgs: ["/assets/images/avatar-soft.png", "/logo/mg-mark.svg"],
    headline: "שירים לנשימה עמוקה",
    blurb: "בלדות עדינות, צליל נקי ורוגע אחרי יום ארוך.",
  },
  {
    key: "fun",
    label: "מקפיץ",
    imgs: ["/assets/images/avatar-fun.png", "/logo/mg-mark.svg"],
    headline: "בוסט של אנרגיה",
    blurb: "ביטים חדים, הוקים קליטים ואווירת מסיבה.",
  },
];

/** פריסת מיקום/עומק (x,y,z) */
const LAYOUT = [
  [0.35, 0.16, 0.0],
  [0.72, -0.04, 0.12],
  [0.24, -0.26, 0.28],
  [0.94, 0.08, 0.42],
] as const;

/* ============================================================
   טעינה חכמה של תמונות + cache
   ============================================================ */
const bitmapCache = new Map<string, THREE.Texture>();
const pendingCache = new Map<string, Promise<THREE.Texture>>();

async function loadBitmapTexture(url: string): Promise<THREE.Texture> {
  if (bitmapCache.has(url)) return bitmapCache.get(url)!;
  if (pendingCache.has(url)) return pendingCache.get(url)!;

  const job = (async () => {
    try {
      const resp = await fetch(url, {
        mode: "cors",
        credentials: "omit",
        cache: "force-cache",
      });
      const blob = await resp.blob();
      const bmp = await createImageBitmap(blob);
      const tex = new THREE.Texture(bmp);
      (tex as any).colorSpace =
        (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding;
      tex.anisotropy = 8;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      bitmapCache.set(url, tex);
      return tex;
    } catch {
      const loader = new THREE.TextureLoader();
      return await new Promise<THREE.Texture>((resolve, reject) => {
        loader.setCrossOrigin("anonymous");
        loader.load(
          url,
          (tex) => {
            if ("colorSpace" in tex)
              (tex as any).colorSpace =
                (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding;
            tex.anisotropy = 8;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.needsUpdate = true;
            bitmapCache.set(url, tex);
            resolve(tex);
          },
          undefined,
          reject,
        );
      });
    }
  })();

  pendingCache.set(url, job);
  try {
    return await job;
  } finally {
    pendingCache.delete(url);
  }
}

/* ============================================================
   useSmartUrl — לוקח את הכתובת הראשונה שעובדת (כולל preload hint)
   ============================================================ */
function useSmartUrl(candidates: string[]) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;

    candidates.forEach((u) => {
      const l = document.createElement("link");
      l.rel = "preload";
      l.as = "image";
      l.href = u;
      document.head.appendChild(l);
      setTimeout(() => l.remove(), 4000);
    });

    (async () => {
      for (const u of candidates) {
        const ok = await new Promise<boolean>((res) => {
          const img = new Image();
          img.decoding = "async";
          img.loading = "eager";
          img.crossOrigin = "anonymous";
          img.onload = () => res(true);
          img.onerror = () => res(false);
          img.src = u;
        });
        if (!alive) return;
        if (ok) {
          setUrl(u);
          break;
        }
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates.join("|")]);

  return url;
}

/* ============================================================
   Loader מינימלי (useProgress)
   ============================================================ */
function SceneLoader() {
  const { progress, active } = useProgress();
  const pct = Math.floor(progress);
  return (
    <Html center style={{ pointerEvents: "none" }}>
      <div
        dir="rtl"
        className="rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur px-4 py-2 text-sm shadow-lg"
      >
        {active ? (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-black/70 dark:bg-white/70" />
            <span>טוען סצנה… {pct}%</span>
          </div>
        ) : (
          <span>מוכן ✓</span>
        )}
      </div>
    </Html>
  );
}

/* ============================================================
   AvatarPlane — כרטיס/תמונה עם רגישות לבאסים/ביטים
   ============================================================ */
function AvatarPlane({
  url,
  base,
  mouse,
  phase = 0,
  depth = 0,
  focus = 0.6,
  reduceMotion = false,
  reactToBeat = true,
  quality = 1,
}: {
  url: string;
  base: [number, number];
  mouse: THREE.Vector2;
  phase?: number;
  depth?: number;
  focus?: number;
  reduceMotion?: boolean;
  reactToBeat?: boolean;
  quality?: number; // 0.5..1
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const g = useRef<THREE.Group>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const tint = useRef(new THREE.Color(0xffffff));

  useEffect(() => {
    let alive = true;
    (async () => {
      const tex = await loadBitmapTexture(url);
      if (!alive) return;
      tex.anisotropy = Math.max(4, Math.min(16, (maxAniso || 16) * quality));
      tex.needsUpdate = true;
      const img: any = tex.image;
      setSize([img?.width ?? 1, img?.height ?? 1]);
      matRef.current?.setValues({ map: tex, opacity: 0.85 });
      if (matRef.current) matRef.current.needsUpdate = true;
    })();
    return () => {
      alive = false;
    };
  }, [url, maxAniso, quality]);

  const baseH = 1.32;
  const planeW = useMemo(() => {
    if (!size) return baseH;
    const [w, h] = size;
    return baseH * (w / h);
  }, [size]);

  // אודיו
  const { level, beatTick } = useAudioPulse(0.9);
  const lastBeat = useRef(0);
  const beatBoost = useRef(0); // 0..1

  const { bass, treble } = useAudioBands(0.88);
  const bandsRef = useRef({ bass: 0, treble: 0 });
  useEffect(() => {
    bandsRef.current = { bass, treble };
  }, [bass, treble]);

  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.getElapsedTime() + phase;

    const mx = THREE.MathUtils.clamp(mouse.x, -0.8, 0.8);
    const my = THREE.MathUtils.clamp(mouse.y, -0.8, 0.8);
    const parallaxX = reduceMotion ? 0 : mx * (0.1 + depth * 0.04);
    const parallaxY = reduceMotion ? 0 : -my * (0.07 + depth * 0.03);

    if (reactToBeat && lastBeat.current !== beatTick) {
      lastBeat.current = beatTick;
      beatBoost.current = 1;
    }
    beatBoost.current = Math.max(0, beatBoost.current * 0.86);

    const bobY = reduceMotion ? 0 : Math.sin(t * (1.1 + depth * 0.15)) * 0.05;
    const rotY = reduceMotion ? 0 : Math.sin(t * 0.9) * (0.05 + depth * 0.02);
    const rotX = reduceMotion ? 0 : Math.cos(t * 1.2) * (0.04 + depth * 0.02);

    const targetOpacity = 0.25 + 0.75 * focus;
    const focusScale = 1 + 0.09 * (focus - 0.6);

    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(
        matRef.current.opacity ?? 1,
        targetOpacity,
        0.15,
      );
    }

    g.current.position.set(
      base[0] + parallaxX,
      base[1] + bobY + parallaxY,
      -depth,
    );

    const dance = reduceMotion ? 0 : level * 0.11 + beatBoost.current * 0.15;
    g.current.rotation.set(rotX + dance * 0.02, rotY - dance * 0.02, 0);

    const breathe = reduceMotion ? 1 : 1 + Math.sin(t * 1.6) * 0.012;
    const pulse = reduceMotion
      ? 1
      : breathe + level * 0.05 + beatBoost.current * 0.06;
    g.current.scale.set(pulse * focusScale, pulse * focusScale, 1);

    g.current.position.y += reduceMotion ? 0 : beatBoost.current * 0.06;

    if (!reduceMotion && matRef.current) {
      const { bass: b, treble: tr } = bandsRef.current;
      const mix = b / (b + tr + 1e-4);
      const hue = 260 - 220 * mix;
      const sat = THREE.MathUtils.clamp(
        0.25 + Math.max(b, tr) * 0.6,
        0.25,
        0.9,
      );
      const light = 0.95;
      const tint = new THREE.Color();
      tint.setHSL(hue / 360, sat, light);
      matRef.current.color.lerp(tint, 0.15);
    }
  });

  return (
    <group ref={g}>
      {!reduceMotion && (
        <mesh position={[0, -0.02, -0.0001]}>
          <planeGeometry args={[planeW * 0.9, baseH * 0.28]} />
          <meshBasicMaterial transparent opacity={0.18} color="#000" />
        </mesh>
      )}

      <mesh>
        <planeGeometry args={[planeW, baseH]} />
        <meshBasicMaterial
          ref={matRef}
          transparent
          alphaTest={0.05}
          color="white"
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

/* ============================================================
   ParticleField — InstancedMesh קליל
   ============================================================ */
function ParticleField({
  count = 160,
  area = [1.8, 1.2],
  depth = 1.2,
  reduceMotion = false,
  quality = 1,
}: {
  count?: number;
  area?: [number, number];
  depth?: number;
  reduceMotion?: boolean;
  quality?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const speeds = useMemo(
    () => Float32Array.from({ length: count }, () => 0.1 + Math.random() * 0.6),
    [count],
  );
  const offsets = useMemo(
    () =>
      Float32Array.from({ length: count }, () => Math.random() * Math.PI * 2),
    [count],
  );

  useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * area[0];
      const y = (Math.random() - 0.5) * area[1];
      const z = -Math.random() * depth;
      dummy.position.set(x, y, z);
      const s =
        (reduceMotion ? 0.004 : 0.006) * (0.6 + Math.random() * 0.8) * quality;
      dummy.scale.setScalar(s);
      dummy.rotation.z = Math.random() * Math.PI;
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, area, depth, dummy, reduceMotion, quality]);

  useFrame((_, dt) => {
    if (!ref.current || reduceMotion) return;
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      ref.current.getMatrixAt(i, m);
      p.setFromMatrixPosition(m);
      const s = speeds[i] * 0.04 * (quality * 0.9 + 0.1);
      p.y += Math.sin(offsets[i] + performance.now() * 0.0006) * s * 0.2;
      p.x += Math.cos(offsets[i] + performance.now() * 0.0004) * s * 0.15;
      if (p.y > area[1] * 0.6) p.y = -area[1] * 0.6;
      if (p.x > area[0] * 0.6) p.x = -area[0] * 0.6;
      dummy.position.copy(p);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial transparent opacity={0.1} color="#ffffff" />
    </instancedMesh>
  );
}

/* ============================================================
   BeatRipples — טבעות על ביט
   ============================================================ */
function BeatRipples({ reduceMotion = false }: { reduceMotion?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { beatTick } = useAudioPulse(0.92);
  const rings = useRef<Array<{ born: number; life: number; mesh: THREE.Mesh }>>(
    [],
  );
  const lastBeat = useRef(0);

  useEffect(() => {
    rings.current = [];
  }, []);

  useFrame(({ clock }) => {
    if (reduceMotion) return;
    const t = clock.getElapsedTime();

    if (lastBeat.current !== beatTick) {
      lastBeat.current = beatTick;
      if (group.current) {
        const mesh = new THREE.Mesh(
          new THREE.RingGeometry(0.05, 0.052, 48),
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.55,
            color: 0xffffff,
          }),
        );
        mesh.position.set(
          0.55 + (Math.random() - 0.5) * 0.4,
          -0.02 + (Math.random() - 0.5) * 0.25,
          -0.6,
        );
        group.current.add(mesh);
        rings.current.push({ born: t, life: 0.9, mesh });
        if (rings.current.length > 12) {
          const old = rings.current.shift();
          old?.mesh.geometry.dispose();
          (old?.mesh.material as THREE.Material)?.dispose();
          old && group.current?.remove(old.mesh);
        }
      }
    }

    const keep: typeof rings.current = [];
    rings.current.forEach((r) => {
      const k = THREE.MathUtils.clamp((t - r.born) / r.life, 0, 1);
      r.mesh.scale.setScalar(1 + k * 2.4);
      const mat = r.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - k) * 0.55;
      if (t - r.born < r.life) keep.push(r);
      else {
        r.mesh.geometry.dispose();
        (r.mesh.material as THREE.Material).dispose();
        group.current?.remove(r.mesh);
      }
    });
    rings.current = keep;
  });

  return <group ref={group} />;
}

/* ============================================================
   QuadScene — ארבעת האווטארים + רקע חלקיקים
   ============================================================ */
function QuadScene({
  mouse,
  focusIdx,
  reduceMotion,
  quality,
}: {
  mouse: THREE.Vector2;
  focusIdx: number;
  reduceMotion: boolean;
  quality: number;
}) {
  const urls = [
    useSmartUrl(CATEGORIES[0].imgs),
    useSmartUrl(CATEGORIES[1].imgs),
    useSmartUrl(CATEGORIES[2].imgs),
    useSmartUrl(CATEGORIES[3].imgs),
  ];
  const ready = urls.every(Boolean);

  return (
    <Suspense fallback={<SceneLoader />}>
      <ParticleField reduceMotion={reduceMotion} quality={quality} />
      {ready &&
        urls.map((u, i) => (
          <AvatarPlane
            key={(u as string) + i}
            url={u as string}
            mouse={mouse}
            base={[LAYOUT[i][0], LAYOUT[i][1]]}
            depth={LAYOUT[i][2]}
            phase={i * 0.7}
            focus={i === focusIdx ? 1 : 0.55}
            reduceMotion={reduceMotion}
            reactToBeat
            quality={quality}
          />
        ))}
      <BeatRipples reduceMotion={reduceMotion} />
      <Preload all />
    </Suspense>
  );
}

/* ============================================================
   קטגוריות (כפתורי טאבים)
   ============================================================ */
function CategoryChips({
  active,
  onChange,
}: {
  active: CategoryKey;
  onChange: (k: CategoryKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="בחירת וייב"
      className="flex flex-wrap gap-2"
      dir="rtl"
    >
      {CATEGORIES.map((c) => {
        const selected = c.key === active;
        return (
          <button
            key={c.key}
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${c.key}`}
            onClick={() => onChange(c.key)}
            className={[
              "px-3 py-1.5 rounded-full text-sm border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
              selected
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                : "bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800",
            ].join(" ")}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   Hero3D — ראשי
   ============================================================ */
export default function Hero3D() {
  const [activeKey, setActiveKey] = useState<CategoryKey>("mizrahi");
  const focusIdx = useMemo(
    () =>
      Math.max(
        0,
        CATEGORIES.findIndex((c) => c.key === activeKey),
      ),
    [activeKey],
  );
  const reduceMotion = useReducedMotion() || false;

  const [hover, setHover] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const mouse = useRef(new THREE.Vector2(0, 0));
  const sceneRef = useRef<HTMLDivElement>(null);

  // Throttle עם rAF
  const rafRef = useRef<number | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    last.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const v = last.current;
        if (!v) return;
        mouse.current.set(v.x * 2 - 1, v.y * 2 - 1);
        setCursor({ x: v.x * rect.width, y: v.y * rect.height });
      });
    }
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const activeCat = CATEGORIES[focusIdx] ?? CATEGORIES[0];

  // Pause/Resume סצנה כאשר מחוץ למסך
  const inView = useInView(sceneRef, {
    margin: "-20% 0px -20% 0px",
    once: false,
  });

  // DPR/איכות אדפטיביים
  const [dpr, setDpr] = useState<[number, number]>([1, 1.8]);
  const [quality, setQuality] = useState(1);

  // Tilt עדין לכרטיס
  const tilt = hover
    ? {
        rotateX:
          -((cursor.y / (sceneRef.current?.clientHeight || 1)) * 4 - 2) || 0,
        rotateY: (cursor.x / (sceneRef.current?.clientWidth || 1)) * 6 - 3 || 0,
      }
    : { rotateX: 0, rotateY: 0 };

  return (
    <section
      className="relative"
      style={{
        background:
          "radial-gradient(800px 400px at 90% -10%, rgba(124,92,255,.12), transparent 60%), radial-gradient(600px 320px at 10% 120%, rgba(198,91,255,.10), transparent 60%)",
      }}
    >
      <div className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-10 max-w-6xl mx-auto px-4 py-12">
        {/* טקסט/CTA */}
        <div className="order-2 md:order-1 text-right">
          <motion.h1
            id={`panel-${activeCat.key}`}
            className="text-3xl md:text-5xl font-extrabold tracking-tight"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
          >
            {activeCat.headline}
          </motion.h1>

          <motion.p
            className="mt-3 opacity-80 leading-relaxed text-[15px]"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            {activeCat.blurb}
          </motion.p>

          <div className="mt-6">
            <CategoryChips active={activeKey} onChange={setActiveKey} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2 justify-end">
            <a
              href="/book"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-neutral-900 text-white dark:bg_white dark:text-neutral-900 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            >
              הזמנת הופעה
            </a>
            <a
              href="/playlists"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            >
              פלייליסטים
            </a>
          </div>
        </div>

        {/* סצנת ה-3D */}
        <motion.div
          ref={sceneRef}
          className="order-1 md:order-2 relative h-[360px] md:h-[480px] rounded-2xl overflow-visible"
          style={{ perspective: 1000, transformStyle: "preserve-3d" }}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          onPointerMove={onPointerMove}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          onTouchStart={() => setHover(true)}
          onTouchEnd={() => setHover(false)}
          animate={tilt}
        >
          {/* עוטף עם מסכה עגולה אמיתית כדי לבטל “שפיצים” */}
          <div
            className="absolute inset-0 rounded-2xl mm-rounded-mask overflow-hidden"
            aria-hidden
          >
            <Canvas
              className="pointer-events-none absolute inset-0"
              dpr={dpr}
              camera={{ position: [0, 0.7, 2.2], fov: 35 }}
              gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
              frameloop={inView ? "always" : "never"}
              onCreated={({ gl }) => {
                if ("outputColorSpace" in gl && (THREE as any).SRGBColorSpace) {
                  (gl as any).outputColorSpace = (THREE as any).SRGBColorSpace;
                } else if (
                  "outputEncoding" in gl &&
                  (THREE as any).sRGBEncoding
                ) {
                  (gl as any).outputEncoding = (THREE as any).sRGBEncoding;
                }
              }}
            >
              <PerformanceMonitor
                onDecline={() => {
                  setDpr([1, 1.4]);
                  setQuality((q) => Math.max(0.7, q - 0.1));
                }}
                onIncline={() => {
                  setDpr([1, 1.8]);
                  setQuality((q) => Math.min(1, q + 0.05));
                }}
                ms={250}
                bounds={(n) => Math.max(30, Math.min(120, n))}
              />
              <QuadScene
                mouse={mouse.current}
                focusIdx={focusIdx}
                reduceMotion={!!reduceMotion}
                quality={quality}
              />
            </Canvas>
          </div>

          {/* אפקט גלואו לעכבר */}
          <AnimatePresence>
            {hover && !reduceMotion && (
              <motion.div
                key="cursor-glow"
                className="pointer-events-none absolute z-10 h-8 w-8 rounded-full blur-lg"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
                  left: 0,
                  top: 0,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 0.8,
                  scale: 1,
                  x: cursor.x - 16,
                  y: cursor.y - 16,
                }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 250, damping: 24 }}
              />
            )}
          </AnimatePresence>

          {/* מסגרת דקה מעל המסכה */}
          <div className="absolute inset-0 rounded-2xl border border-black/10 dark:border-white/10 pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   טיפ: הוסף פעם אחת ב-<head> פרה-קונקט/פרה-לוד לתמונות
   <link rel="preload" as="image" href="/assets/images/avatar-chabad.png" />
   <link rel="preload" as="image" href="/assets/images/avatar-mizrahi.png" />
   <link rel="preload" as="image" href="/assets/images/avatar-soft.png" />
   <link rel="preload" as="image" href="/assets/images/avatar-fun.png" />
   ============================================================ */
