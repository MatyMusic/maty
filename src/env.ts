// src/env.ts
export const DISABLE_SPLASH: boolean =
  process.env.NEXT_PUBLIC_DISABLE_SPLASH === "1" ||
  process.env.NEXT_PUBLIC_DISABLE_SPLASH === "true";
