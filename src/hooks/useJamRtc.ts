// src/hooks/useJamRtc.ts
"use client";

import { useRtcRoom } from "@/hooks/useRtcRoom";

/**
 * חיבור ל-RTC קיים, עם roomId לפי groupId
 * roomId לדוגמה: jam:group:<id>
 */
export function useJamRtc(groupId?: string) {
  const roomId = groupId ? `jam:group:${groupId}` : undefined;

  const rtc = useRtcRoom({
    roomId,
    area: "jam",
    // אפשר להוסיף כאן עוד options אם יש לך ב-useRtcRoom
  });

  return rtc;
}
