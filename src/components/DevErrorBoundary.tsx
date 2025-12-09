"use client";
import React from "react";

export default class DevErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: Error }
> {
  state = { error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    // ללוג מפורט
    console.error("[ErrorBoundary]", { error, info });
  }

  render() {
    if (this.state.error) {
      return (
        <div dir="rtl" style={{ padding: 16, background: "#fee2e2", color: "#7f1d1d" }}>
          <b>שגיאת לקוח:</b> {this.state.error.message}
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}