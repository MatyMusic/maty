"use client";
import { useEffect, useState } from "react";

/** Responsive flags for quick conditional UI tweaks */
export function useResponsive() {
  const [w, setW] = useState<number>(
    typeof window === "undefined" ? 1024 : window.innerWidth,
  );
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  const sm = w >= 640;
  const md = w >= 768;
  const lg = w >= 1024;
  const xl = w >= 1280;
  return { w, sm, md, lg, xl };
}
