// src/maty/ui/Toaster.tsx
"use client";

// קומפוננטה שאפשר למקם איפשהו ב-layout, כרגע לא מציירת כלום
export function MatyToaster() {
  return null;
}

/**
 * showToast – API פשוט שמונע קריסה.
 * אפשר בהמשך להחליף למשהו יותר יפה (מודאל/טוסט).
 */
export function showToast(message: string) {
  if (typeof window !== "undefined") {
    // הכי פשוט כדי שלא יישבר לך כלום:
    window.alert(message);
  } else {
    console.log("[toast]", message);
  }
}

export default MatyToaster;
