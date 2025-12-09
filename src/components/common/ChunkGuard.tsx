// src/components/common/ChunkGuard.tsx
"use client";
import * as React from "react";

function isChunkError(e: unknown) {
  const msg = (e && (e as any).message) || "";
  return /ChunkLoadError|Loading chunk .* failed/i.test(String(msg));
}

export default class ChunkGuard extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hadError: boolean; msg?: string }
> {
  state = { hadError: false as boolean, msg: "" as string };

  static getDerivedStateFromError(error: any) {
    return { hadError: true, msg: String(error?.message || error) };
  }

  componentDidCatch(error: any) {
    // נסה רענון חד־פעמי אם זה שגיאת צ'אנק
    if (typeof window !== "undefined" && isChunkError(error)) {
      const key = "mm:chunk:reloaded";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        location.reload();
      }
    }
  }

  render() {
    if (this.state.hadError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl border p-3 text-sm opacity-80">
            שגיאה בטעינת רכיב. נסה לרענן.{" "}
            {this.state.msg ? `(${this.state.msg})` : ""}
          </div>
        )
      );
    }
    return this.props.children;
  }
}
