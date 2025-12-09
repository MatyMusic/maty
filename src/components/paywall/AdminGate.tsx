"use client";
import React from "react";
import useIsAdmin from "@/hooks/useIsAdmin";

/**
 * אם המשתמש אדמין → מציגים children ישר (בלי מנעולים).
 * אחרת → מציגים fallback (ה-modal/upsell הקיים שלך).
 */
export default function AdminGate({
  children,
  fallback,
  whileLoading = null,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  whileLoading?: React.ReactNode;
}) {
  // useIsAdmin מחושב סינכרוני (אין הבדל סדר הוקים)
  const isAdmin = useIsAdmin();

  // אין "טעינה" אמיתית—אבל נותן אופציה אם תרצה future-proof
  if (isAdmin === undefined || isAdmin === null) return <>{whileLoading}</>;

  return <>{isAdmin ? children : fallback}</>;
}
