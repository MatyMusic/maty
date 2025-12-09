// src/components/player/PlayerRoot.tsx
"use client";

import ProPlayer from "@/components/ProPlayer";

/**
 * שורש הנגן הגלובלי:
 * - מונטן פעם אחת בלייאאוט
 * - כל האתר מדבר איתו דרך אירועים: mm:play / mm:queue:add / mm:queue:clear
 * - ניהול התור, הניגון, הווליום – בתוך ProPlayer עצמו
 */
export default function PlayerRoot() {
  return <ProPlayer />;
}
