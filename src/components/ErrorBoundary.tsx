"use client";
import React from "react";

type Props = {
  name?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any) {
    return { hasError: true, error: err };
  }

  componentDidCatch(err: any, info: any) {
    console.error(`[Boundary:${this.props.name ?? "unnamed"}]`, err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border p-4 text-sm">
            <div className="font-bold">נפלה שגיאה ברכיב: {this.props.name ?? "?"}</div>
            <div className="opacity-80 mt-1">
              {String(this.state.error?.message ?? this.state.error)}
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
