// src/hooks/useFeatures.ts
"use client";
import { useState, useEffect, useContext } from "react";
import { AdminContext } from "@/contexts/admin";

/** Hook לשימוש במצב פיצ'רים (וידאו, צ'אט, פרימיום) עבור המשתמש הנוכחי */
export function useFeatures() {
  // משתמשים בקונטקסט אדמין כדי למנוע קריאה כפולה ל-API אם זה אדמין
  const isAdminCtx = useContext(AdminContext);
  const [features, setFeatures] = useState({
    canUseVideo: false,
    canUseChat: false,
    canAccessPremium: false,
  });

  useEffect(() => {
    // אם המשתמש אדמין – אין צורך בבדיקת API (כל ההרשאות כבר true)
    if (isAdminCtx) {
      setFeatures({
        canUseVideo: true,
        canUseChat: true,
        canAccessPremium: true,
      });
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/features", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = await res.json();
        if (!alive) return;
        if (data && data.ok) {
          setFeatures({
            canUseVideo: !!data.canUseVideo,
            canUseChat: !!data.canUseChat,
            canAccessPremium: !!data.canAccessPremium,
          });
        } else {
          // במקרה שגיאה – ברירת מחדל: ללא הרשאות פרימיום
          setFeatures({
            canUseVideo: false,
            canUseChat: false,
            canAccessPremium: false,
          });
        }
      } catch {
        if (alive) {
          setFeatures({
            canUseVideo: false,
            canUseChat: false,
            canAccessPremium: false,
          });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [isAdminCtx]);

  return features;
}
