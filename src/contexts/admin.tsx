// src/contexts/admin.tsx
"use client";

import * as React from "react";

type AdminContextValue = {
  isAdmin: boolean;
};

const AdminContext = React.createContext<AdminContextValue>({
  isAdmin: false,
});

export function AdminProvider({
  children,
  isAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
}) {
  return (
    <AdminContext.Provider value={{ isAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return React.useContext(AdminContext);
}
