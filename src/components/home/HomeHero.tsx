// src/components/home/HomeHero.tsx
"use client";

/**
 * MATY-MUSIC · HOME HERO V3
 * ---------------------------------------------------------
 * Hero משודרג כולל:
 * - אווטארים תלת־ממדיים “נושמים” ומגיבים בעדינות למוזיקה
 * - אינטגרציה ל-AI דרך /api/ai/*
 * - סרגל סטטוס מערכת + Metrics חיים + MATY-DATE Now
 * - CTA-ים תלת־ממדיים
 * - רייל יצירת קשר
 * - Quick Actions חכמים (סטים, שירים, הזמנות)
 */
import { DateOnlineStrip } from "@/components/home/DateOnlineStrip";

import { Preload, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

import { useAudioPulse } from "@/hooks/useAudioPulse";
import { useT } from "@/lib/i18n/I18nProvider";

/* ================== Dynamic MiniPlayer + Guard ================== */

const MiniPlayer = dynamic(
  () => import("@/components/MiniPlayer").then((m: any) => m.default || m),
  {
    ssr: false,
    loading: () => <SkeletonRow />,
  },
);

function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-neutral-900/60 p-3 text-xs">
      <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
    </div>
  );
}

/** ErrorBoundary להגנה על MiniPlayer בדינאמיק אימפורט */
function ChunkGuard({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line react/display-name
  const EB: any = (function () {
    // @ts-expect-error class-inside-fn
    return class extends (require("react") as any).Component<
      { children: React.ReactNode },
      { err?: any }
    > {
      constructor(props: any) {
        super(props);
        this.state = { err: null };
      }
      static getDerivedStateFromError(err: any) {
        return { err };
      }
      componentDidCatch(err: any) {
        const msg = String(err?.message || err || "");
        const isChunk =
          /ChunkLoadError|Loading chunk .* failed/i.test(msg) ||
          /failed to fetch dynamically imported module/i.test(msg);
        if (typeof window !== "undefined" && isChunk) {
          const k = "mm:chunk:reloaded";
          if (!sessionStorage.getItem(k)) {
            sessionStorage.setItem(k, "1");
            location.reload();
          }
        }
      }
      render() {
        if (this.state.err) return <SkeletonRow />;
        return this.props.children;
      }
    };
  })();
  return <EB>{children}</EB>;
}

/* ================== Types & Constants ================== */

type MiniTrack = {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover?: string;
  link?: string;
};

type CategoryKey = "chabad" | "mizrahi" | "soft" | "fun";

type Cat = {
  key: CategoryKey;
  label: string;
  imgs: string[];
  href: string;
  blurb: string;
  track: MiniTrack;
};

type CTAKey =
  | "maty-date"
  | "shadchanit-miriam"
  | "maty-club"
  | "events"
  | "pricing"
  | "gallery"
  | "book"
  | "nigunim-chabad"
  | "maty-ai";

type CTA = {
  href: string;
  title: string;
  subtitle: string;
  emoji: string;
  key: CTAKey;
  badge?: string;
};

type AiSuggestion = {
  id: string;
  title: string;
  text: string;
  kind: "setlist" | "lyrics" | "idea" | "tip";
};

type HomeMetrics = {
  listenersNow?: number;
  tracksInDb?: number;
  upcomingEvents?: number;
};

/**
 * חוזה ל-API /api/maty-date/now (צד שרת)
 * דוגמה לתגובה אפשרית:
 * {
 *   "onlineCount": 27,
 *   "nearbyCount": 5,
 *   "similarTasteCount": 12,
 *   "highlightUser": {
 *     "name": "דנה",
 *     "age": 26,
 *     "city": "ירושלים",
 *     "style": "chabad" // או string חופשי
 *   }
 * }
 */
type MatyDateHighlightUser = {
  name: string;
  age?: number;
  city?: string;
  style?: CategoryKey | string;
};

type MatyDateNow = {
  onlineCount?: number;
  nearbyCount?: number;
  similarTasteCount?: number;
  highlightUser?: MatyDateHighlightUser;
};

type SystemStatus = {
  matyAi?: "online" | "offline" | "degraded";
  googleAi?: "online" | "offline" | "degraded";
  musicApi?: "online" | "offline" | "degraded";
  lastUpdate?: string;
};

/* ================== Labels & Assets ================== */

const LABEL: Record<CategoryKey, string> = {
  chabad: "חסידי (חב״ד)",
  mizrahi: "מזרחי",
  soft: "שקט",
  fun: "מקפיץ",
};

const AVATAR: Record<CategoryKey, string> = {
  chabad: "/assets/images/avatar-chabad.png",
  mizrahi: "/assets/images/avatar-mizrahi.png",
  soft: "/assets/images/avatar-soft.png",
  fun: "/assets/images/avatar-fun.png",
};

/* CTA בסיסיים */
const BASE_CTAS: CTA[] = [
  {
    href: "/date", // מתאים לזרימת MATY-DATE בפועל
    title: "MATY-DATE",
    subtitle: "שידוכים חכמים לקהילות יהודיות",
    emoji: "💞",
    key: "maty-date",
    badge: "חדש",
  },
  {
    href: "/matchmakers/miriam-portnoy",
    title: "שדכנית · מרים פורטנוי",
    subtitle: "התאמות חכמות, ליווי אישי ועדין",
    emoji: "🕊️",
    key: "shadchanit-miriam",
  },
  {
    href: "/maty-club",
    title: "MATY-CLUB",
    subtitle: "פיד, סטורי, צ׳אטים ומתנות",
    emoji: "✨",
    key: "maty-club",
    badge: "Community",
  },
  {
    href: "/events",
    title: "אירועים",
    subtitle: "חתונות, בר/בת מצווה, הופעות חיות",
    emoji: "🎤",
    key: "events",
  },
  {
    href: "/pricing",
    title: "מחירון",
    subtitle: "חבילות גמישות לכל כיס",
    emoji: "💳",
    key: "pricing",
  },
  {
    href: "/gallery",
    title: "גלריה",
    subtitle: "תמונות ווידאו מאירועים",
    emoji: "📸",
    key: "gallery",
  },
  {
    href: "/book",
    title: "הזמנת הופעה",
    subtitle: "בדיקת זמינות וסגירת תאריך",
    emoji: "📅",
    key: "book",
    badge: "Hot",
  },
  {
    href: "/nigunim/chabad",
    title: "ניגוני חב״ד",
    subtitle: "מאגר מאוחד מכל הרשת",
    emoji: "🎶",
    key: "nigunim-chabad",
  },
];

/* DEMO Cats fallback */
const CATS_DEMO: Cat[] = (
  ["chabad", "mizrahi", "soft", "fun"] as CategoryKey[]
).map((key) => ({
  key,
  label: LABEL[key],
  imgs: [AVATAR[key]],
  href: `/genre/${key}`,
  blurb:
    key === "chabad"
      ? "ניגונים שמרימים את הנפש"
      : key === "mizrahi"
        ? "ים־תיכוני בועט"
        : key === "soft"
          ? "בלדות לנשימה עמוקה"
          : "בוסט של אנרגיה",
  track: {
    id: `demo-${key}`,
    title:
      key === "chabad"
        ? "Nigun Uplift"
        : key === "mizrahi"
          ? "Hafla Groove"
          : key === "soft"
            ? "Deep Breath"
            : "Energy Boost",
    artist: `Maty Music · ${LABEL[key]}`,
    src: "",
    cover: AVATAR[key],
  },
}));

/* ================== Utils ================== */

const AUDIO_RX = /\.(mp3|m4a|ogg|wav)(\?|$)/i;
function isAudioUrl(u?: string) {
  if (!u) return false;
  if (u.startsWith("/")) {
    const q = u.split("?")[1] || "";
    const qs = new URLSearchParams(q);
    const inner = qs.get("u") || u;
    return AUDIO_RX.test(inner);
  }
  return /^https?:\/\//i.test(u) && AUDIO_RX.test(u);
}

function cx(...arr: Array<string | undefined | null | false>) {
  return arr.filter(Boolean).join(" ");
}

function isAdminFromSession(session: any): boolean {
  const role = session?.user?.role;
  const flag = session?.user?.isAdmin === true;
  return !!(role === "admin" || role === "superadmin" || flag);
}

/** בודק האם MATY-AI פעיל (ENV ואח"כ API) */
function useMatyAiEnabled() {
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    const env = String(process.env.NEXT_PUBLIC_MATY_AI_ENABLED || "").trim();
    if (env === "1" || env.toLowerCase() === "true") {
      setEnabled(true);
      return;
    }
    (async () => {
      try {
        const r = await fetch("/api/ai/status", { cache: "no-store" });
        if (!alive) return;
        if (r.ok) {
          const j = await r.json().catch(() => null);
          setEnabled(Boolean(j?.ok || j?.enabled));
        }
      } catch {
        setEnabled(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return enabled;
}

/** בודק האם אינטגרציית Google AI פעילה (ENV בלבד בצד לקוח) */
function useGoogleAiEnabled() {
  const [enabled, setEnabled] = useState<boolean>(false);
  useEffect(() => {
    const env = String(
      process.env.NEXT_PUBLIC_GOOGLE_AI_ENABLED || "",
    ).toLowerCase();
    setEnabled(env === "1" || env === "true");
  }, []);
  return enabled;
}

function useCTAsFiltered(isAdmin: boolean, matyAiEnabled: boolean): CTA[] {
  const ctas: CTA[] = [...BASE_CTAS];
  if (matyAiEnabled && !isAdmin) {
    ctas.splice(2, 0, {
      href: "/ai",
      title: "MATY-AI",
      subtitle: "עוזר חכם למוזיקה, שידוכים ואירועים",
      emoji: "🤖",
      key: "maty-ai",
      badge: "AI",
    });
  }
  return ctas;
}

/** Smart image loader */
function useSmartUrl(candidates: string[]) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const u of candidates) {
        const ok = await new Promise<boolean>((res) => {
          const img = new Image();
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

/* ================== 3D AvatarPlane ================== */

function AvatarPlane({
  src,
  mouseTarget,
  seed = 0,
  reduceMotion = false,
  reactToBeat = true,
}: {
  src: string;
  mouseTarget: THREE.Vector2;
  seed?: number;
  reduceMotion?: boolean;
  reactToBeat?: boolean;
}) {
  const tex = useTexture(src);

  useEffect(() => {
    if ("colorSpace" in tex && (THREE as any).SRGBColorSpace) {
      (tex as any).colorSpace = (THREE as any).SRGBColorSpace;
    }
    tex.anisotropy = 16;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
  }, [tex]);

  const w = (tex.image as HTMLImageElement | undefined)?.width ?? 1;
  const h = (tex.image as HTMLImageElement | undefined)?.height ?? 1;
  const baseH = 1.35;
  const planeW = baseH * (w / h);

  const groupRef = useRef<THREE.Group>(null);
  const cur = useRef(new THREE.Vector2(0, 0));

  // נשתמש רק ברמת העוצמה, בלי "ביט" דרמטי
  const { level } = useAudioPulse(0.8);
  const smoothLevel = useRef(0);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime() + seed;

    // תנועה עדינה של העכבר (יותר איטית)
    cur.current.lerp(mouseTarget, reduceMotion ? 0.04 : 0.1);
    const mx = THREE.MathUtils.clamp(cur.current.x, -1, 1);
    const my = THREE.MathUtils.clamp(cur.current.y, -1, 1);

    // החלקת רמת האודיו שלא יהיו קפיצות
    smoothLevel.current = smoothLevel.current * 0.9 + level * 0.1;

    const audioFactor = reactToBeat && !reduceMotion ? smoothLevel.current : 0;

    // "נשימה" אנכית רכה
    const baseBob = Math.sin(t * 0.6) * (reduceMotion ? 0.015 : 0.05);
    const px = reduceMotion ? 0 : mx * 0.28;
    const py = reduceMotion ? 0 : -my * 0.22;

    groupRef.current.position.set(px, baseBob + py, 0);

    // סיבוב עדין, בלי שייק
    const rotY =
      (reduceMotion ? 0 : Math.sin(t * 0.5) * 0.03 + mx * 0.22) +
      audioFactor * 0.03;
    const rotX =
      (reduceMotion ? 0 : Math.cos(t * 0.7) * 0.025 - my * 0.18) -
      audioFactor * 0.02;

    groupRef.current.rotation.set(rotX, rotY, 0);

    // סקייל “נושם” + תגובה מאוד עדינה למוזיקה
    const breathe = 1 + Math.sin(t * 0.9) * 0.02;
    const pulse = breathe + audioFactor * 0.04;
    groupRef.current.scale.set(pulse, pulse, 1);
  });

  return (
    <group ref={groupRef}>
      {/* הילה עדינה מתחת לאווטאר */}
      <mesh position={[0, -0.15, -0.25]}>
        <circleGeometry args={[1.3, 48]} />
        <meshBasicMaterial
          color={0x5544ff}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh>
        <planeGeometry args={[planeW, baseH]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.05} />
      </mesh>
    </group>
  );
}

/* ================== ContactRail ================== */

function ContactRail() {
  const email = String(
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "book@maty-music.com",
  );
  const waPhone = String(process.env.NEXT_PUBLIC_WHATSAPP || "972501234567");
  const waText = encodeURIComponent("היי מתי, אשמח לפרטים על הופעה 🎤");

  return (
    <>
      <div
        className="fixed left-3 bottom-5 z-[70] flex flex-col gap-2"
        dir="rtl"
      >
        <a
          href={`mailto:${email}`}
          aria-label="שליחת אימייל למתי"
          className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/95 dark:bg-neutral-900/95 border border-black/10 dark:border-white/10 shadow hover:scale-105 transition will-change-transform animate-[hhPulse_2s_ease-in-out_infinite]"
          title="שלח אימייל"
        >
          ✉️
        </a>
        <a
          href={`https://wa.me/${waPhone}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="פתיחת וואטסאפ למתי"
          className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-[#25D366] text-white shadow hover:scale-105 transition will-change-transform animate-[hhWiggle_3.2s_ease-in-out_infinite]"
          title="וואטסאפ"
        >
          ☎️
        </a>
      </div>

      <style jsx>{`
        @keyframes hhPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }
        @keyframes hhWiggle {
          0%,
          100% {
            transform: rotate(0deg);
          }
          15% {
            transform: rotate(2deg);
          }
          30% {
            transform: rotate(-2deg);
          }
          45% {
            transform: rotate(1deg);
          }
          60% {
            transform: rotate(-1deg);
          }
        }
      `}</style>
    </>
  );
}

/* ================== AvatarCard ================== */

function AvatarCard({ cat, i }: { cat: Cat; i: number }) {
  const reduceMotion = useReducedMotion() ?? false;
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, s: 1 });
  const mouseTarget = useRef(new THREE.Vector2(0, 0));
  const url = useSmartUrl(cat.imgs);
  const isTouch = useMemo(
    () => typeof window !== "undefined" && "ontouchstart" in window,
    [],
  );

  const broadcastCat = useCallback(() => {
    try {
      window.dispatchEvent(
        new CustomEvent("mm:setCategory", { detail: { category: cat.key } }),
      );
    } catch {}
  }, [cat.key]);

  const onMove = (e: React.MouseEvent) => {
    if (!boxRef.current || isTouch || reduceMotion) return;
    const r = boxRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mouseTarget.current.set(px * 2 - 1, py * 2 - 1);
    setTilt({ rx: -(py - 0.5) * 12, ry: (px - 0.5) * 16, s: 1.02 });
  };
  const onLeave = () => {
    if (!reduceMotion) {
      setTilt({ rx: 0, ry: 0, s: 1 });
      mouseTarget.current.set(0, 0);
    }
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 120, damping: 16, delay: i * 0.06 }
      }
      className="relative z-[1]"
    >
      <div
        ref={boxRef}
        className="relative rounded-3xl p-4 md:p-5 border bg-white/70 dark:bg-neutral-900/70 border-black/10 dark:border-white/10 shadow-md"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.s})`,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={onMove}
        onMouseEnter={broadcastCat}
        onMouseLeave={onLeave}
        onFocus={broadcastCat}
      >
        <Link
          href={cat.href}
          aria-label={`פתח קטגוריה: ${cat.label} – ${cat.blurb}`}
          className="group block cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-2xl"
          draggable={false}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            style={{
              backgroundImage:
                "radial-gradient(60% 60% at 30% 20%, rgba(255,255,255,0.25), transparent 70%), radial-gradient(50% 50% at 80% 70%, rgba(99,102,241,0.20), transparent 70%)",
              backgroundSize: "200% 200%",
            }}
          />

          <div
            className="relative h-[260px] rounded-2xl overflow-hidden"
            style={{ transform: "translateZ(18px)" }}
          >
            {url && (
              <Canvas
                className="pointer-events-none absolute inset-0"
                frameloop="always"
                dpr={[1, 1.75]}
                camera={{ position: [0, 0.7, 2.2], fov: 35 }}
                gl={{
                  antialias: true,
                  alpha: true,
                  powerPreference: "high-performance",
                  depth: true,
                  stencil: false,
                }}
                onCreated={({ gl }) => {
                  if (
                    "outputColorSpace" in gl &&
                    (THREE as any).SRGBColorSpace
                  ) {
                    (gl as any).outputColorSpace = (
                      THREE as any
                    ).SRGBColorSpace;
                  }
                }}
              >
                <Suspense fallback={null}>
                  <AvatarPlane
                    src={url}
                    mouseTarget={mouseTarget.current}
                    seed={i * 0.7}
                    reactToBeat={!reduceMotion}
                    reduceMotion={reduceMotion}
                  />
                  <Preload all />
                </Suspense>
              </Canvas>
            )}

            {!url && (
              <img
                src={AVATAR[cat.key]}
                alt={cat.label}
                className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                loading="lazy"
              />
            )}
          </div>

          <div
            className="mt-3 text-right"
            style={{ transform: "translateZ(14px)" }}
          >
            <div className="text-base font-extrabold tracking-tight">
              {cat.label}
            </div>
            <div className="text-sm opacity-75">{cat.blurb}</div>
          </div>
        </Link>

        <div className="mt-3" style={{ transform: "translateZ(12px)" }}>
          {cat.track?.src && isAudioUrl(cat.track.src) ? (
            <ChunkGuard>
              <MiniPlayer track={cat.track} />
            </ChunkGuard>
          ) : cat.track?.link ? (
            <a
              href={cat.track.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 px-3 py-2 text-xs hover:bg-white/95 dark:hover:bg-neutral-800/80 transition"
              title="פתח לשמיעה בחלון חדש"
            >
              🎧 פתח לשמיעה
            </a>
          ) : (
            <SkeletonRow />
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ================== CTA3DCard ================== */

function CTA3DCard({ item, i }: { item: CTA; i: number }) {
  const reduceMotion = useReducedMotion() ?? false;
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, s: 1 });
  const [hover, setHover] = useState(false);

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current || reduceMotion) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = -(py - 0.5) * 10;
    const ry = (px - 0.5) * 14;
    setTilt({ rx, ry, s: 1.02 });
  };
  const onLeave = () => {
    setTilt({ rx: 0, ry: 0, s: 1 });
    setHover(false);
  };

  const extraCls =
    item.key === "book"
      ? "animate-[hhPulse_1.8s_ease-in-out_infinite,hhWiggle_4s_ease-in-out_infinite]"
      : item.key === "maty-ai"
        ? "ring-2 ring-violet-500/70 shadow-lg"
        : "";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 140, damping: 16, delay: i * 0.05 }
      }
      className="relative will-change-transform z-[5]"
    >
      {!reduceMotion && (
        <motion.div
          aria-hidden
          className={cx(
            "pointer-events-none absolute inset-0 -z-10 blur-2xl rounded-[28px]",
            hover ? "opacity-100" : "opacity-80",
          )}
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 16 + i * 2,
            ease: "linear",
          }}
          style={{
            background:
              "conic-gradient(from 0deg, rgba(236,72,153,0.28), rgba(99,102,241,0.35), rgba(236,72,153,0.28))",
          }}
        />
      )}

      <Link
        ref={ref}
        href={item.href}
        onMouseMove={onMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={onLeave}
        className={cx(
          "block rounded-[22px] border bg-white/75 dark:bg-neutral-900/70 border-black/10 dark:border-white/10",
          "shadow-[0_10px_30px_rgba(0,0,0,.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,.35)]",
          "select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          "pointer-events-auto",
          extraCls,
        )}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.s})`,
          transformStyle: "preserve-3d",
        }}
        aria-label={`${item.title} – ${item.subtitle}`}
      >
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="absolute -inset-[1px] rounded-[22px] overflow-hidden pointer-events-none"
            initial={false}
            animate={{
              backgroundPosition: hover
                ? ["0% 0%", "100% 100%"]
                : ["50% 50%", "50% 50%"],
            }}
            transition={{
              duration: 2.5,
              repeat: hover ? Infinity : 0,
              ease: "easeInOut",
            }}
            style={{
              backgroundImage:
                "radial-gradient(30% 30% at 20% 10%, rgba(255,255,255,0.35), transparent 70%), radial-gradient(30% 30% at 80% 70%, rgba(99,102,241,0.25), transparent 70%)",
              backgroundSize: "200% 200%",
              mixBlendMode: "overlay",
            }}
          />
        )}

        <div
          className="relative grid gap-1.5 p-4 text-right"
          style={{ transform: "translateZ(14px)" }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-2xl" aria-hidden>
              {item.emoji}
            </div>
            {item.badge && (
              <span className="inline-flex items-center rounded-full bg-violet-600/95 text-white text-[11px] px-2 py-[2px] font-semibold shadow-sm">
                {item.badge}
              </span>
            )}
          </div>
          <div className="text-base font-extrabold tracking-tight">
            {item.title}
          </div>
          <div className="text-sm opacity-75">{item.subtitle}</div>
          <div className="mt-3 flex justify-end">
            <span className="inline-flex items-center gap-1 text-xs font-semibold">
              המשך
              <motion.span
                initial={false}
                animate={{ x: hover ? 4 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 16 }}
                aria-hidden
              >
                →
              </motion.span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ================== AiHeroBar ================== */

function AiHeroBar({
  matyAiEnabled,
  googleAiEnabled,
}: {
  matyAiEnabled: boolean;
  googleAiEnabled: boolean;
}) {
  const { data: session } = useSession();
  const name =
    session?.user?.name ||
    session?.user?.nickname ||
    session?.user?.email?.split("@")[0] ||
    "אורח";

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const anyAi = matyAiEnabled || googleAiEnabled;

  const loadSuggestions = useCallback(
    async (reason: "mount" | "click") => {
      if (!anyAi) return;
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/ai/hero?reason=${reason}`, {
          cache: "no-store",
        });
        if (!r.ok) throw new Error("AI hero " + r.status);
        const j = await r.json().catch(() => null);
        const rows = (j?.items || j?.suggestions || []) as any[];

        const mapped: AiSuggestion[] = rows.slice(0, 4).map((it, idx) => ({
          id:
            String(it.id || it._id || idx) +
            "-" +
            Math.random().toString(36).slice(2),
          title:
            it.title ||
            it.heading ||
            (idx === 0
              ? "סט להופעה הקרובה"
              : idx === 1
                ? "שדרוג שירה ומעברים"
                : "השראה מוזיקלית"),
          text:
            it.text ||
            it.body ||
            "בקש מ־AI לבנות לך סט פתיחה, גשר וסגירה, מותאם לקהל.",
          kind: it.kind || it.type || "idea",
        }));

        if (!mapped.length) {
          setSuggestions([
            {
              id: "fallback-a",
              title: "סט קאנטרי-חסידי לחתונה",
              text: "פתיחה חסידית, אמצע קאנטרי באנגלית, סיום מעגלים מקפיץ.",
              kind: "setlist",
            },
            {
              id: "fallback-b",
              title: "טקסט לשיר מקורי",
              text: "בקש מ־AI לכתוב בית ופזמון על 'המכבים של 443' באווירת קאנטרי.",
              kind: "lyrics",
            },
          ]);
        } else {
          setSuggestions(mapped);
        }
      } catch (err: any) {
        console.error(err);
        setError("לא הצלחתי לטעון הצעות AI כרגע.");
      } finally {
        setLoading(false);
      }
    },
    [anyAi],
  );

  useEffect(() => {
    if (anyAi) void loadSuggestions("mount");
  }, [anyAi, loadSuggestions]);

  return (
    <section
      className="mx-auto max-w-6xl px-4 pt-4 md:pt-6 pb-3 md:pb-4"
      dir="rtl"
    >
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-l from-violet-700/90 via-violet-600/95 to-fuchsia-600/90 text-white shadow-lg overflow-hidden relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 0%, rgba(255,255,255,0.35), transparent 60%), radial-gradient(circle at 80% 100%, rgba(255,255,255,0.20), transparent 60%)",
          }}
        />

        <div className="relative z-[1] flex flex-col md:flex-row items-start gap-4 md:gap-6 p-4 md:p-5">
          <div className="flex-1 text-right">
            <div className="flex items-center justify-end gap-2 text-[11px] font-semibold mb-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-[2px] border border-white/20">
                <span
                  className={cx(
                    "h-1.5 w-1.5 rounded-full animate-pulse",
                    anyAi ? "bg-emerald-400" : "bg-yellow-300",
                  )}
                />
                {anyAi
                  ? "AI מחובר · MATY-AI + Google"
                  : "מצב AI: צריך חיבור לשרת"}
              </span>
              {googleAiEnabled && (
                <span className="hidden sm:inline text-[11px] opacity-80">
                  Google-style AI דרך ה־Backend פעיל ✅
                </span>
              )}
            </div>

            <h2 className="text-lg md:text-xl font-extrabold leading-tight">
              שלום {name}, בוא ניתן ל־AI להכין איתך את הסט הבא 🎧
            </h2>
            <p className="mt-1 text-xs md:text-sm opacity-90 max-w-xl ml-auto">
              מכאן אתה יוצא עם רעיונות לסטים, טקסטים לשירים, פתיחים לאירועים
              וטיפים לשדרוג ההופעה – הכל בכמה לחיצות.
            </p>
          </div>

          <div className="w-full md:w-[320px]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-xs font-semibold opacity-90">
                הצעות AI חכמות:
              </div>
              <button
                type="button"
                onClick={() => loadSuggestions("click")}
                disabled={!anyAi || loading}
                className="inline-flex items-center gap-1 rounded-full bg-white/15 hover:bg-white/25 px-2.5 py-[3px] text-[11px] border border-white/25 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                <span className={loading ? "animate-spin" : ""}>🔄</span>
                לרענן
              </button>
            </div>

            {error && (
              <div className="text-[11px] text-red-100 mb-2">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-1.5">
              {suggestions.map((s) => (
                <Link
                  key={s.id}
                  href={
                    s.kind === "setlist"
                      ? "/ai?mode=setlist"
                      : s.kind === "lyrics"
                        ? "/ai?mode=lyrics"
                        : "/ai"
                  }
                  className="group rounded-2xl bg-white/10 hover:bg-white/18 border border-white/20 px-3 py-2 text-[11px] md:text-xs transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-[2px]">
                    <span className="font-semibold group-hover:underline">
                      {s.title}
                    </span>
                    <span aria-hidden>
                      {s.kind === "setlist"
                        ? "🎼"
                        : s.kind === "lyrics"
                          ? "📝"
                          : s.kind === "tip"
                            ? "💡"
                            : "✨"}
                    </span>
                  </div>
                  <p className="opacity-90 line-clamp-2">{s.text}</p>
                </Link>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-[11px] opacity-90">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  טוען הצעות AI...
                </div>
              )}

              {!loading && !suggestions.length && (
                <div className="text-[11px] opacity-90">
                  הפעל AI בצד השרת וקבל כאן רעיונות חכמים לסטים וטקסטים.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================== MetricsStrip – חיבור ל-API + פס גלילה + MATY-DATE Now ================== */

function MetricsStrip() {
  const [data, setData] = useState<HomeMetrics | null>(null);
  const [matyNow, setMatyNow] = useState<MatyDateNow | null>(null);

  // מה שמוצג בפועל (כולל אנימציה)
  const [display, setDisplay] = useState({
    listenersNow: 10,
    tracksInDb: 1000,
    upcomingEvents: 5,
  });

  // טעינה מחודשת מה-API הכללי
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const r = await fetch("/api/metrics/home", { cache: "no-store" });
        if (!alive) return;
        if (!r.ok) throw new Error("metrics " + r.status);
        const j = await r.json().catch(() => null);
        if (!j) return;
        setData({
          listenersNow: j.listenersNow ?? j.onlineListeners ?? undefined,
          tracksInDb: j.tracksInDb ?? j.totalTracks ?? undefined,
          upcomingEvents: j.upcomingEvents ?? j.events ?? undefined,
        });
      } catch {
        // שקט – נישאר על ערכי ברירת מחדל
      }
    }

    load();
    const id = setInterval(load, 20000); // ריענון כל 20 שניות
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // טעינת MATY-DATE now (מי מחובר, מי סביבי וכו׳)
  useEffect(() => {
    let alive = true;

    async function loadMaty() {
      try {
        const r = await fetch("/api/maty-date/now", { cache: "no-store" });
        if (!alive) return;
        if (!r.ok) throw new Error("maty-date now " + r.status);
        const j = await r.json().catch(() => null);
        if (!j) return;
        setMatyNow({
          onlineCount: j.onlineCount ?? j.totalOnline ?? undefined,
          nearbyCount: j.nearbyCount ?? j.onlineNearby ?? undefined,
          similarTasteCount:
            j.similarTasteCount ?? j.similarTasteOnline ?? undefined,
          highlightUser: j.highlightUser ?? undefined,
        });
      } catch {
        // אפשר להישאר בלי – זה פיצ׳ר "מתנה"
      }
    }

    loadMaty();
    const id = setInterval(loadMaty, 25000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // אנימציה רכה מהערכים הנוכחיים לערכים החדשים
  useEffect(() => {
    if (!data) return;

    const target = {
      listenersNow: data.listenersNow ?? display.listenersNow,
      tracksInDb: data.tracksInDb ?? display.tracksInDb,
      upcomingEvents: data.upcomingEvents ?? display.upcomingEvents,
    };

    const duration = 600; // מ״ש
    const fps = 60;
    const steps = Math.max(1, Math.round((duration / 1000) * fps));
    let frame = 0;

    const start = { ...display };

    const id = setInterval(() => {
      frame++;
      const t = frame / steps;
      if (t >= 1) {
        setDisplay(target);
        clearInterval(id);
        return;
      }
      // ease-out עדין
      const ease = 1 - Math.pow(1 - t, 3);

      setDisplay({
        listenersNow: Math.round(
          start.listenersNow +
            (target.listenersNow - start.listenersNow) * ease,
        ),
        tracksInDb: Math.round(
          start.tracksInDb + (target.tracksInDb - start.tracksInDb) * ease,
        ),
        upcomingEvents: Math.round(
          start.upcomingEvents +
            (target.upcomingEvents - start.upcomingEvents) * ease,
        ),
      });
    }, 1000 / fps);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.listenersNow, data?.tracksInDb, data?.upcomingEvents]);

  // קצת "חיים" גם בלי API – רנדומיזציה עדינה סביב הערכים
  useEffect(() => {
    const id = setInterval(() => {
      setDisplay((prev) => ({
        listenersNow: Math.max(
          1,
          prev.listenersNow + (Math.random() > 0.5 ? 1 : -1),
        ),
        tracksInDb: Math.max(
          50,
          prev.tracksInDb + (Math.random() > 0.5 ? 3 : -3),
        ),
        upcomingEvents: Math.max(
          0,
          prev.upcomingEvents + (Math.random() > 0.6 ? 1 : 0),
        ),
      }));
    }, 8000); // כל 8 שניות שינוי קטן

    return () => clearInterval(id);
  }, []);

  const baseItems = [
    {
      label: "מאזינים עכשיו",
      value: display.listenersNow.toLocaleString("he-IL"),
      emoji: "👂",
    },
    {
      label: "שירים במערכת",
      value: display.tracksInDb.toLocaleString("he-IL"),
      emoji: "🎵",
    },
    {
      label: "אירועים קרובים",
      value: display.upcomingEvents.toLocaleString("he-IL"),
      emoji: "📆",
    },
  ];

  const extraItems: { label: string; value: string; emoji: string }[] = [];

  if (matyNow?.onlineCount) {
    extraItems.push({
      label: "מחוברים ל-MATY-DATE",
      value: matyNow.onlineCount.toLocaleString("he-IL"),
      emoji: "💞",
    });
  }

  if (matyNow?.similarTasteCount) {
    extraItems.push({
      label: "עם טעם מוזיקלי כמו שלך",
      value: matyNow.similarTasteCount.toLocaleString("he-IL"),
      emoji: "🎧",
    });
  }

  if (matyNow?.nearbyCount) {
    extraItems.push({
      label: "קרובים אליך",
      value: matyNow.nearbyCount.toLocaleString("he-IL"),
      emoji: "📍",
    });
  }

  const items = [...baseItems, ...extraItems];
  const highlight = matyNow?.highlightUser;

  const highlightStyleLabel =
    highlight?.style && typeof highlight.style === "string"
      ? (LABEL[highlight.style as CategoryKey] ?? String(highlight.style))
      : highlight?.style
        ? LABEL[highlight.style as CategoryKey]
        : undefined;

  return (
    <section
      className="mx-auto max-w-6xl px-4 pb-2 md:pb-3"
      dir="rtl"
      aria-label="סטטוס מערכת חי"
    >
      <div className="relative overflow-hidden">
        <div className="flex gap-3 animate-metric-marquee whitespace-nowrap">
          {items.map((it) => (
            <div
              key={it.label}
              className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 px-2.5 py-[3px] text-[11px] md:text-xs opacity-85"
            >
              <span aria-hidden>{it.emoji}</span>
              <span className="font-semibold">{it.value}</span>
              <span>· {it.label}</span>
            </div>
          ))}

          {/* כפילות בשביל מרקיזה אינסופית */}
          {items.map((it, idx) => (
            <div
              key={it.label + "-dup-" + idx}
              className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 px-2.5 py-[3px] text-[11px] md:text-xs opacity-70"
            >
              <span aria-hidden>{it.emoji}</span>
              <span className="font-semibold">{it.value}</span>
              <span>· {it.label}</span>
            </div>
          ))}
        </div>
      </div>

      {highlight && (
        <div className="mt-2 flex justify-end">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-black/5 dark:bg-white/5 px-3 py-2 text-[11px] md:text-xs">
            <span aria-hidden>💫</span>
            <div className="text-right">
              <div className="font-semibold">
                {highlight.name}
                {highlight.age ? `, ${highlight.age}` : ""}{" "}
                {highlight.city ? `· ${highlight.city}` : ""}
              </div>
              <div className="opacity-80">
                {highlightStyleLabel
                  ? `מחובר/ת עכשיו, אוהב/ת מוזיקה ${highlightStyleLabel}.`
                  : "מחובר/ת עכשיו ל-MATY-DATE."}
              </div>
            </div>
            <Link
              href="/date"
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-violet-600 text-white px-2.5 py-[3px] text-[10px] hover:bg-violet-500 transition"
            >
              <span>להצטרפות</span>
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes metric-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-metric-marquee {
          animation: metric-marquee 24s linear infinite;
          will-change: transform;
        }
      `}</style>
    </section>
  );
}

/* ================== SystemStatusDock ================== */

function SystemStatusDock() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/system/status", { cache: "no-store" });
        if (!alive) return;
        if (!r.ok) throw new Error("status " + r.status);
        const j = await r.json().catch(() => null);
        if (!j) return;
        setStatus({
          matyAi: j.matyAi ?? "online",
          googleAi: j.googleAi ?? "online",
          musicApi: j.musicApi ?? "online",
          lastUpdate: j.lastUpdate ?? new Date().toISOString(),
        });
      } catch {
        // fallback VM
        setStatus({
          matyAi: "degraded",
          googleAi: "offline",
          musicApi: "online",
          lastUpdate: new Date().toISOString(),
        });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const pill = (label: string, state?: string) => {
    let color = "bg-emerald-500";
    let text = "Online";
    if (state === "offline") {
      color = "bg-rose-500";
      text = "Offline";
    } else if (state === "degraded") {
      color = "bg-amber-400";
      text = "Degraded";
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-black/5 dark:bg-white/5 px-2 py-[1px] text-[10px]">
        <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
        <span>{label}</span>
        <span className="opacity-70">· {text}</span>
      </span>
    );
  };

  if (!status) return null;

  return (
    <div className="fixed right-3 bottom-4 z-[60] hidden md:block" dir="rtl">
      <div className="rounded-2xl bg-white/85 dark:bg-neutral-900/85 border border-black/10 dark:border-white/10 shadow-lg px-3 py-2 text-[10px] flex flex-col gap-1.5 max-w-[260px]">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">סטטוס מערכות</span>
          <span className="opacity-70">
            {new Date(status.lastUpdate || "").toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {pill("MATY-AI", status.matyAi)}
          {pill("Google AI", status.googleAi)}
          {pill("Music API", status.musicApi)}
        </div>
      </div>
    </div>
  );
}

/* ================== QuickActionsDock ================== */

function QuickActionsDock() {
  return (
    <div className="fixed right-3 top-[96px] z-[60]" dir="rtl">
      <div className="flex flex-col gap-2">
        <Link
          href="/ai?mode=setlist"
          className="inline-flex items-center gap-1 rounded-full bg-violet-600 text-white text-[11px] px-3 py-[6px] shadow hover:bg-violet-500 transition"
        >
          🎼
          <span>סט חכם לערב</span>
        </Link>
        <Link
          href="/ai?mode=lyrics"
          className="inline-flex items-center gap-1 rounded-full bg-fuchsia-600 text-white text-[11px] px-3 py-[6px] shadow hover:bg-fuchsia-500 transition"
        >
          📝
          <span>טקסט לשיר חדש</span>
        </Link>
        <Link
          href="/book"
          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white text-[11px] px-3 py-[6px] shadow hover:bg-emerald-500 transition"
        >
          📅
          <span>בדיקת זמינות</span>
        </Link>
      </div>
    </div>
  );
}

/* ================== Normalize API → MiniTrack ================== */

function normalizeToMiniTrack(it: any, key: CategoryKey): MiniTrack | null {
  if (!it) return null;

  const candidates = [
    it.src,
    it.url,
    it.audioUrl,
    it.preview_url,
    it.streamUrl,
  ].filter(Boolean) as string[];

  const bestAudio =
    candidates.find((u) => isAudioUrl(u)) ||
    (it.proxy ? `/api/proxy?u=${encodeURIComponent(String(it.proxy))}` : "") ||
    "";

  const id = String(
    it.id ||
      it._id ||
      it.publicId ||
      `${key}-${Math.random().toString(36).slice(2)}`,
  );

  const title = String(it.title || it.name || it.publicId || "Untitled");
  const cover = (it.cover || it.thumbUrl || AVATAR[key]) as string;
  const link = (it.link || it.sourceUrl || it.videoUrl || it.externalUrl) as
    | string
    | undefined;

  return {
    id,
    title,
    artist: `Maty Music · ${LABEL[key]}`,
    src: bestAudio,
    cover,
    link,
  };
}

/* ================== MAIN: HomeHero ================== */

export default function HomeHero() {
  const t = useT();
  const { data: session } = useSession();
  const isAdmin = isAdminFromSession(session);
  const matyAiEnabled = useMatyAiEnabled();
  const googleAiEnabled = useGoogleAiEnabled();
  const CTAS = useCTAsFiltered(isAdmin, matyAiEnabled);

  const [mounted, setMounted] = useState(false);
  const [cats, setCats] = useState<Cat[]>(CATS_DEMO);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const results = await Promise.all(
          CATS_DEMO.map(async (cat) => {
            let track: MiniTrack | null = null;
            try {
              const r = await fetch(
                `/api/music?tag=hero&cat=${cat.key}&limit=1`,
                { cache: "no-store" },
              );
              if (!r.ok) throw new Error(`music ${r.status}`);
              const ct = r.headers.get("content-type") || "";
              const j = ct.includes("application/json") ? await r.json() : null;
              const raw = j?.tracks?.[0] ?? j?.rows?.[0] ?? null;
              track = normalizeToMiniTrack(raw, cat.key);
            } catch {
              // fallback
            }
            return { key: cat.key, track };
          }),
        );
        if (!alive) return;
        setCats((prev) =>
          prev.map((c) => {
            const hit = results.find((r) => r.key === c.key && r.track);
            return hit?.track ? { ...c, track: hit.track } : c;
          }),
        );
      } catch {
        // שקט
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      <ContactRail />
      <SystemStatusDock />
      <QuickActionsDock />

      <AiHeroBar
        matyAiEnabled={matyAiEnabled}
        googleAiEnabled={googleAiEnabled}
      />

      <MetricsStrip />
      <DateOnlineStrip />

      <section
        className="relative z-[1] mx-auto max-w-6xl px-4 pt-3 md:pt-4"
        dir="rtl"
      >
        <h1 className="sr-only">{t("site.brand")}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
          {cats.map((cat, i) => (
            <AvatarCard key={cat.key} cat={cat} i={i} />
          ))}
        </div>
      </section>

      <section
        className="relative z-[5] mx-auto max-w-6xl px-4 py-10 md:py-14"
        dir="rtl"
      >
        <div className="mb-6 text-right">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-extrabold md:text-3xl"
          >
            {t("home.ctaSectionTitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-1 opacity-80"
          >
            {t("home.ctaSectionSubtitle")}
          </motion.p>
        </div>

        <div className="mx-auto max-w-5xl relative z-[6]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 justify-items-stretch">
            {CTAS.slice(0, 3).map((c, i) => (
              <CTA3DCard key={c.href} item={c} i={i} />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 justify-items-stretch">
            {CTAS.slice(3).map((c, i) => (
              <CTA3DCard key={c.href} item={c} i={i + 3} />
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes hhPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.045);
          }
        }
        @keyframes hhWiggle {
          0%,
          100% {
            transform: rotate(0deg);
          }
          10% {
            transform: rotate(1.2deg);
          }
          20% {
            transform: rotate(-1.2deg);
          }
          30% {
            transform: rotate(0.8deg);
          }
          40% {
            transform: rotate(-0.8deg);
          }
          50% {
            transform: rotate(0.4deg);
          }
        }
      `}</style>
    </>
  );
}
