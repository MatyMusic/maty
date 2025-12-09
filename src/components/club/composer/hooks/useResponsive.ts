"use client";
import { useEffect, useState } from "react";
export function useResponsive() {
  const [w, setW] = useState<number>(
    typeof window === "undefined" ? 1024 : window.innerWidth,
  );
  useEffect(() => {
    const onR = () => setW(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  const sm = w >= 640,
    md = w >= 768,
    lg = w >= 1024,
    xl = w >= 1280;
  return { w, sm, md, lg, xl };
}
