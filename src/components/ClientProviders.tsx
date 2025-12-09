// src/components/ClientProviders.tsx
"use client";

import FloatingPlayer from "@/components/FloatingPlayer";
import { PlayerProvider } from "@/context/player";
import { ToastProvider } from "@/contexts/toast";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <PlayerProvider>
        {children}

        {/* נגן צף גלובלי עם X, ווליום, סקרבר, YouTube iframe פנימי */}
        <FloatingPlayer />
      </PlayerProvider>
    </ToastProvider>
  );
}
