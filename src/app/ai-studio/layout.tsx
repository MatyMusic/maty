// src/app/ai-studio/layout.tsx
"use client";
import { AIStudioProvider } from "@/contexts/ai-studio";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AIStudioProvider>{children}</AIStudioProvider>;
}
