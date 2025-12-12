// src/components/hero/Maty3DAvatar.tsx
"use client";

import { Float, Text, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";

export default function Maty3DAvatar() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-[1px] ring-1 ring-sky-500/40">
      <div className="h-[260px] md:h-[300px] rounded-3xl bg-black/90">
        <Canvas camera={{ position: [0, 0, 3.6], fov: 40 }}>
          <Suspense fallback={null}>
            <MusicalScene />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

/* ───────────────── סצנה ראשית ───────────────── */

function MusicalScene() {
  return (
    <>
      {/* תאורה עדינה בלבד */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-3, -2, -4]} intensity={0.4} />

      {/* טקסט MATY ברקע */}
      <MatyBackText />

      {/* טבעת תווים מסביב – סולם מוזיקלי */}
      <NotesRing />

      {/* אווטאר + טבעת דקה + Glow */}
      <Float
        speed={1.2}
        rotationIntensity={0.35}
        floatIntensity={0.4}
        position={[0, -0.05, 0]}
      >
        <AvatarWithRing />
      </Float>
    </>
  );
}

/* ───────────────── טקסט MATY ברקע ───────────────── */

function MatyBackText() {
  return (
    <group position={[0, 0.7, -0.4]}>
      <Text
        fontSize={0.55}
        letterSpacing={0.08}
        color="#0ea5e9"
        anchorX="center"
        anchorY="middle"
        outlineColor="#22d3ee"
        outlineWidth={0.008}
        fillOpacity={0.15}
      >
        MATY
      </Text>
    </group>
  );
}

/* ───────────────── טבעת תווים – סולם מוזיקלי ───────────────── */

function NotesRing() {
  const group = useRef<THREE.Group | null>(null);

  useFrame(({ clock, mouse }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.z = t * 0.15;
    group.current.rotation.x = mouse.y * 0.3;
    group.current.rotation.y = mouse.x * 0.4;
  });

  const notes = Array.from({ length: 24 });

  return (
    <group ref={group} position={[0, -0.05, -0.1]}>
      {notes.map((_, i) => {
        const angle = (i / notes.length) * Math.PI * 2;
        const radius = 1.9;
        const yOffset = Math.sin(angle * 2) * 0.25;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * 0.25 + yOffset;
        const z = Math.sin(angle) * 0.3;

        const char = i % 2 === 0 ? "♪" : "♫";

        return (
          <Text
            key={i}
            position={[x, y, z]}
            fontSize={0.12}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            {char}
          </Text>
        );
      })}
    </group>
  );
}

/* ───────────────── האווטאר + טבעת דקה + Glow ───────────────── */

function AvatarWithRing() {
  const texture = useTexture("/assets/images/maty_clean_transparent.png");
  const group = useRef<THREE.Group | null>(null);

  // אפקט "נשימה" עדין לטבעת + הילה
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 1.5) * 0.02; // ±2% שינוי גודל
    group.current.scale.set(s, s, s);
  });

  return (
    <group ref={group}>
      {/* הילה חיצונית רכה */}
      <mesh position={[0, 0, -0.03]}>
        <circleGeometry args={[1.12, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} />
      </mesh>

      {/* הילה פנימית דקה יותר */}
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[1.02, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} />
      </mesh>

      {/* טבעת דקה – “אייפון סטייל” */}
      {/* <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1.0, 0.035, 30, 80]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={0.18}
          metalness={0.35}
          roughness={0.25}
        />
      </mesh> */}

      דיסק כהה מאחורי התמונה
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[0.95, 64]} />
        <meshBasicMaterial color="#020617" />
      </mesh>

      {/* התמונה שלך – דיסק עגול במרכז */}
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[0.93, 64]} />
        <meshBasicMaterial map={texture} transparent />
      </mesh>
    </group>
  );
}
