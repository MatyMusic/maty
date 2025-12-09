// src/contexts/ai-studio.tsx
"use client";
import { createContext, useContext, useState, useCallback } from "react";
import type { AIGenInput, AITrack } from "@/types/ai";

type Ctx = {
  items: AITrack[];
  generate: (input: AIGenInput) => Promise<void>;
  refresh: (id: string) => Promise<void>;
};

const AiCtx = createContext<Ctx | null>(null);

export function AIStudioProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<AITrack[]>([]);

  const generate = useCallback(async (input: AIGenInput) => {
    const r = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const trk: AITrack = await r.json();
    setItems((p) => [trk, ...p]);
  }, []);

  const refresh = useCallback(async (id: string) => {
    const r = await fetch(`/api/ai/status?id=${id}`);
    const trk: AITrack = await r.json();
    setItems((p) => p.map((x) => (x._id === id ? trk : x)));
  }, []);

  return (
    <AiCtx.Provider value={{ items, generate, refresh }}>
      {children}
    </AiCtx.Provider>
  );
}

export function useAIStudio() {
  const ctx = useContext(AiCtx);
  if (!ctx)
    throw new Error("useAIStudio must be used within <AIStudioProvider>");
  return ctx;
}
