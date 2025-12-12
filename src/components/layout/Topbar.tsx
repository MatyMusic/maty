// src/components/layout/Topbar.tsx
"use client";

import { CONTACT } from "@/lib/constants";
import { useState } from "react";

export default function Topbar() {
  const [show, setShow] = useState(true);
  if (!show) return null;

  return (
    <div className="w-full bg-gradient-to-r from-fuchsia-500/20 via-violet-500/20 to-sky-400/20 border-b border-white/10 backdrop-blur">
      <div className="container-section h-10 flex items-center justify-between text-sm">
        <div className="hidden md:block opacity-80">
          🎵 MATY-MUSIC — הופעות חיות, הפקות, אנרגיה
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-emerald-500/90 text-white border-0 px-3 py-1 h-8"
          >
            ווצאפ מיידי • {CONTACT.phoneLocal}
          </a>
          <button
            className="btn h-8 px-2"
            aria-label="סגור פס עליון"
            onClick={() => setShow(false)}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
