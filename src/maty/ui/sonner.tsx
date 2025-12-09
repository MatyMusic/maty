"use client";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      dir="rtl"
      position="top-center"
      richColors
      closeButton
      expand
    />
  );
}
