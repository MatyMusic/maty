// src/contexts/admin.tsx
"use client";
import { createContext, useContext } from "react";

// יצירת Context עבור מידע האם המשתמש הוא אדמין
export const AdminContext = createContext<boolean>(false);

export function AdminProvider({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  return (
    <AdminContext.Provider value={isAdmin}>{children}</AdminContext.Provider>
  );
}
