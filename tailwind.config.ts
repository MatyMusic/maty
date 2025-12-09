// tailwind.config.ts
import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import aspect from "@tailwindcss/aspect-ratio";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/components/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/pages/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  safelist: [{ pattern: /^mm-/ }, { pattern: /^(bg|text|border|ring)-brand$/ }],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-heebo)",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: { brand: { DEFAULT: "#6C5CE7", dark: "#4B32D1" } },
      borderRadius: { "2xl": "1rem" },
      boxShadow: { card: "0 4px 16px rgba(0,0,0,0.06)" },

      /* 💜 אנימציות ל־Header – יציבות ללא צורך ב-animate-[...] */
      keyframes: {
        mmHearts1: {
          "0%": {
            opacity: "0",
            transform: "translate(0,0) scale(.8) rotate(0)",
          },
          "15%": { opacity: ".9" },
          "60%": {
            transform: "translate(-10px,-18px) scale(1.05) rotate(10deg)",
          },
          "100%": {
            opacity: "0",
            transform: "translate(6px,-28px) scale(1.1) rotate(-8deg)",
          },
        },
        mmHearts2: {
          "0%": {
            opacity: "0",
            transform: "translate(0,0) scale(.85) rotate(0)",
          },
          "20%": { opacity: ".9" },
          "65%": {
            transform: "translate(8px,-16px) scale(1.08) rotate(-8deg)",
          },
          "100%": {
            opacity: "0",
            transform: "translate(-6px,-26px) scale(1.12) rotate(12deg)",
          },
        },
        mmHearts3: {
          "0%": {
            opacity: "0",
            transform: "translate(0,0) scale(.8) rotate(0)",
          },
          "10%": { opacity: ".9" },
          "55%": {
            transform: "translate(-6px,-14px) scale(1.02) rotate(6deg)",
          },
          "100%": {
            opacity: "0",
            transform: "translate(4px,-24px) scale(1.1) rotate(-10deg)",
          },
        },
        mmHeartFloatSoft: {
          "0%": {
            transform: "translateY(0) translateX(0) scale(.9)",
            opacity: "0",
          },
          "10%": { opacity: ".45" },
          "50%": {
            transform: "translateY(-12px) translateX(6px) scale(1.02)",
            opacity: ".4",
          },
          "100%": {
            transform: "translateY(-22px) translateX(-6px) scale(1.04)",
            opacity: "0",
          },
        },
        mmDumbbellLift: {
          "0%,100%": { transform: "translateY(0) rotate(0)" },
          "25%": { transform: "translateY(-4px) rotate(-1.5deg)" },
          "50%": { transform: "translateY(-7px) rotate(0)" },
          "75%": { transform: "translateY(-4px) rotate(1.5deg)" },
        },
        mmSparkBurst: {
          "0%": {
            transform: "translateY(0) scale(.6)",
            opacity: "0",
            boxShadow:
              "0 0 0 0 rgba(245,158,11,.35), 0 0 0 0 rgba(245,158,11,0)",
          },
          "20%": { opacity: ".85" },
          "50%": {
            transform: "translateY(-6px) scale(.9)",
            boxShadow:
              "0 0 0 6px rgba(245,158,11,0), 0 0 0 10px rgba(245,158,11,0)",
          },
          "100%": { transform: "translateY(-10px) scale(1)", opacity: "0" },
        },
        mmClubPop: {
          "0%": {
            transform: "translateY(0) scale(.9) rotate(0)",
            opacity: "0",
          },
          "15%": { opacity: ".7" },
          "50%": { transform: "translateY(-10px) scale(1.05) rotate(-8deg)" },
          "100%": {
            transform: "translateY(-18px) scale(1.06) rotate(8deg)",
            opacity: "0",
          },
        },
      },
      animation: {
        mmHearts1: "mmHearts1 2.8s ease-in-out infinite",
        mmHearts2: "mmHearts2 3.1s ease-in-out infinite",
        mmHearts3: "mmHearts3 2.4s ease-in-out infinite",
        mmHeartFloatSoft: "mmHeartFloatSoft 4.8s ease-in-out infinite",
        mmDumbbellLift: "mmDumbbellLift 1.8s ease-in-out infinite",
        mmSparkBurst: "mmSparkBurst 1.8s ease-in-out infinite",
        mmClubPop: "mmClubPop 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [forms, typography, aspect],
};

export default config;
