// src/app/fonts.ts
import { Heebo } from "next/font/google";

// Heebo תומך בעברית, נטען מה-CDN (בלי קבצים מקומיים)
export const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
  variable: "--font-he",
  display: "swap",
  preload: true,
  fallback: [
    "system-ui",
    "Segoe UI",
    "Roboto",
    "Helvetica",
    "Arial",
    "sans-serif",
  ],
});
