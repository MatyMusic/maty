"use client";

import { useEffect, useState } from "react";

export type ResponsiveState = {
  /** min-width >= 640px */
  sm: boolean;
  /** min-width >= 768px */
  md: boolean;
  /** min-width >= 1024px */
  lg: boolean;
  /** min-width >= 1280px */
  xl: boolean;
  /** מידות חלון עדכניות בצד לקוח */
  width: number;
  height: number;
};

const QUERY = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
};

/**
 * useResponsive — הוק רספונסיבי פשוט עם matchMedia
 * בטוח ל־SSR: לא ניגש ל־window בצד שרת.
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    sm: false,
    md: false,
    lg: false,
    xl: false,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mqs = {
      sm: window.matchMedia(QUERY.sm),
      md: window.matchMedia(QUERY.md),
      lg: window.matchMedia(QUERY.lg),
      xl: window.matchMedia(QUERY.xl),
    };

    const update = () =>
      setState({
        sm: mqs.sm.matches,
        md: mqs.md.matches,
        lg: mqs.lg.matches,
        xl: mqs.xl.matches,
        width: window.innerWidth,
        height: window.innerHeight,
      });

    // init
    update();

    // listeners
    const add = (mq: MediaQueryList) =>
      mq.addEventListener
        ? mq.addEventListener("change", update)
        : mq.addListener(update);
    const remove = (mq: MediaQueryList) =>
      mq.removeEventListener
        ? mq.removeEventListener("change", update)
        : mq.removeListener(update);

    add(mqs.sm);
    add(mqs.md);
    add(mqs.lg);
    add(mqs.xl);
    window.addEventListener("resize", update);

    return () => {
      remove(mqs.sm);
      remove(mqs.md);
      remove(mqs.lg);
      remove(mqs.xl);
      window.removeEventListener("resize", update);
    };
  }, []);

  return state;
}

/** עזר קטן אם תרצה לבחור ערך לפי breakpoint נוכחי */
export function useBreakpoint(): "xs" | "sm" | "md" | "lg" | "xl" {
  const R = useResponsive();
  if (R.xl) return "xl";
  if (R.lg) return "lg";
  if (R.md) return "md";
  if (R.sm) return "sm";
  return "xs";
}
