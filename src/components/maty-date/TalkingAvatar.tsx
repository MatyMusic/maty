"use client";

import * as React from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

// ===== Types =====
export type AvatarKind = "emoji" | "blob" | "bot" | "photo";
export type AvatarEmotion = "happy" | "neutral" | "sad" | "excited";
export type BgStyle = "violet" | "pink" | "indigo" | "teal" | "none";

export type TalkingAvatarProps = {
  kind?: AvatarKind;
  emotion?: AvatarEmotion;
  color?: string;
  speaking?: boolean;
  viseme?: number; // 0..1
  imageUrl?: string | null;
  light?: "studio" | "warm" | "cool";
  bg?: BgStyle;
  env?: "studio" | "city" | "sunset" | "dawn" | "night" | "forest";
  dpr?: [number, number];
};

// ===== Utils =====
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const TRANSPARENT_1x1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

// נבנה רקע קטן ולא תופס מקום – מותאם מובייל
function Background({ bg }: { bg: BgStyle }) {
  if (bg === "none") return null;
  const color =
    bg === "violet"
      ? "#3b256b"
      : bg === "pink"
      ? "#5b274a"
      : bg === "indigo"
      ? "#1a2254"
      : "#0b3d3a"; // teal
  return (
    <mesh position={[0, 0, -3]}>
      <planeGeometry args={[8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Lights({ mode }: { mode: "studio" | "warm" | "cool" }) {
  return (
    <>
      <ambientLight intensity={mode === "studio" ? 0.5 : 0.35} />
      <directionalLight
        position={[2, 2, 3]}
        intensity={mode === "studio" ? 0.8 : mode === "warm" ? 0.9 : 0.7}
        color={
          mode === "warm" ? "#ffd6a3" : mode === "cool" ? "#a3c7ff" : "#ffffff"
        }
      />
      <pointLight position={[-2, 1.5, 2]} intensity={0.4} />
    </>
  );
}

// ===== Sub Avatars =====
function EmojiAvatar({
  color = "#8b5cf6",
  speaking,
  viseme = 0,
  emotion = "happy",
}: Pick<TalkingAvatarProps, "color" | "speaking" | "viseme" | "emotion">) {
  const mouth = useRef<THREE.Mesh>(null);
  const eyes = useRef<THREE.Mesh>(null);
  // גודל פה
  const open = clamp01(viseme) * (speaking ? 1 : 0);

  useEffect(() => {
    if (mouth.current) {
      (mouth.current.scale as any).y = 0.2 + open * 0.8;
    }
  }, [open]);

  return (
    <group>
      {/* ראש */}
      <mesh>
        <sphereGeometry args={[0.75, 64, 64]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
      </mesh>
      {/* עיניים */}
      <mesh ref={eyes} position={[0, 0.2, 0.72]}>
        <boxGeometry args={[0.6, 0.2, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* פה */}
      <mesh ref={mouth} position={[0, -0.25, 0.7]}>
        <boxGeometry args={[0.35, 0.2, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* גבות/הבעה בסיסית */}
      {emotion !== "neutral" && (
        <mesh
          position={[0, 0.45, 0.65]}
          rotation={[0, 0, emotion === "sad" ? 0.25 : -0.25]}
        >
          <boxGeometry args={[0.6, 0.08, 0.05]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )}
    </group>
  );
}

function BlobAvatar({
  color = "#22c55e",
  speaking,
  viseme = 0,
}: Pick<TalkingAvatarProps, "color" | "speaking" | "viseme">) {
  const mouth = useRef<THREE.Mesh>(null);
  const open = clamp01(viseme) * (speaking ? 1 : 0);

  useEffect(() => {
    if (mouth.current) {
      (mouth.current.scale as any).y = 0.15 + open * 1.1;
    }
  }, [open]);

  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.2, 0.8]}>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.3, 0.25, 0.7]}>
        <sphereGeometry args={[0.06, 32, 32]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh ref={mouth} position={[0, -0.3, 0.75]}>
        <boxGeometry args={[0.4, 0.15, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

function BotAvatar({
  color = "#60a5fa",
  speaking,
  viseme = 0,
}: Pick<TalkingAvatarProps, "color" | "speaking" | "viseme">) {
  const mouth = useRef<THREE.Mesh>(null);
  const open = clamp01(viseme) * (speaking ? 1 : 0);

  useEffect(() => {
    if (mouth.current) {
      (mouth.current.scale as any).y = 0.12 + open * 1.0;
    }
  }, [open]);

  return (
    <group>
      {/* ראש */}
      <mesh>
        <boxGeometry args={[1.2, 1, 1]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* עיניים */}
      <mesh position={[-0.25, 0.2, 0.52]}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <meshStandardMaterial
          color="#0af"
          emissive="#0af"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0.25, 0.2, 0.52]}>
        <boxGeometry args={[0.2, 0.2, 0.05]} />
        <meshStandardMaterial
          color="#0af"
          emissive="#0af"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* פה */}
      <mesh ref={mouth} position={[0, -0.25, 0.52]}>
        <boxGeometry args={[0.5, 0.12, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* אנטנה */}
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 16]} />
        <meshStandardMaterial color="#999" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color="#f0f"
          emissive="#f0f"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

function PhotoAvatar({
  imageUrl,
  color = "#f472b6",
  speaking,
  viseme = 0,
}: Pick<TalkingAvatarProps, "imageUrl" | "color" | "speaking" | "viseme">) {
  const safe = imageUrl || TRANSPARENT_1x1; // ← לא לקרוס כשאין תמונה
  const tex = useTexture(safe);
  const mouth = useRef<THREE.Mesh>(null);
  const open = clamp01(viseme) * (speaking ? 1 : 0);

  useEffect(() => {
    if (mouth.current) {
      (mouth.current.scale as any).y = 0.1 + open * 1.2;
    }
  }, [open]);

  return (
    <group>
      {/* פריים מעוגל קטן (מותאם מובייל) */}
      <mesh>
        <boxGeometry args={[1.1, 1.4, 0.08]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
      </mesh>
      {/* תמונה */}
      <mesh position={[0, 0.02, 0.06]}>
        <planeGeometry args={[1.0, 1.3]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      {/* אינדיקציה פה (מלבן קטן למטה) */}
      <mesh ref={mouth} position={[0, -0.55, 0.07]}>
        <boxGeometry args={[0.35, 0.08, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

// ===== Main component =====
export default function TalkingAvatar({
  kind = "emoji",
  emotion = "happy",
  color = "#8b5cf6",
  speaking = false,
  viseme = 0,
  imageUrl = null,
  light = "studio",
  bg = "violet",
  env = "studio",
  dpr = [1, 2],
}: TalkingAvatarProps) {
  const mounted = useIsMounted();

  const EnvName =
    env === "city"
      ? "city"
      : env === "sunset"
      ? "sunset"
      : env === "dawn"
      ? "dawn"
      : env === "night"
      ? "night"
      : env === "forest"
      ? "forest"
      : "studio";

  return (
    <div className="w-full h-full">
      {/* כדי למנוע Hydration mismatch – מציירים Canvas רק לאחר mount */}
      {mounted ? (
        <Canvas
          dpr={dpr}
          camera={{ position: [0, 0.6, 2.6], fov: 38 }}
          gl={{ antialias: true }}
        >
          <Suspense fallback={null}>
            <Background bg={bg} />
            <Lights mode={light} />
            <group position={[0, -0.05, 0]}>
              {kind === "emoji" && (
                <EmojiAvatar
                  color={color}
                  speaking={speaking}
                  viseme={viseme}
                  emotion={emotion}
                />
              )}
              {kind === "blob" && (
                <BlobAvatar color={color} speaking={speaking} viseme={viseme} />
              )}
              {kind === "bot" && (
                <BotAvatar color={color} speaking={speaking} viseme={viseme} />
              )}
              {kind === "photo" && (
                <PhotoAvatar
                  imageUrl={imageUrl || null}
                  color={color}
                  speaking={speaking}
                  viseme={viseme}
                />
              )}
            </group>
            <Environment preset={EnvName as any} />
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 2.5}
              maxPolarAngle={Math.PI / 2}
            />
          </Suspense>
        </Canvas>
      ) : (
        <div className="w-full h-full bg-black/30" />
      )}
    </div>
  );
}

function useIsMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
