// src/components/CompanionMount.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { CompanionProvider, SiteCompanion } from "@/components/site-companion";

export default function CompanionMount() {
  const { data } = useSession();

  useEffect(() => {
    const style = (data as any)?.style || (data?.user as any)?.style;
    if (style) {
      try { localStorage.setItem("preferredStyle", style); } catch {}
      (window as any).SiteCompanion?.setGenre?.(style);
    }
  }, [data]);

  return (
    <CompanionProvider>
      <SiteCompanion />
    </CompanionProvider>
  );
}
