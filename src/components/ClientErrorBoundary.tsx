// src/components/ClientErrorBoundary.tsx
'use client';

import React from 'react';

type Props = {
  children: React.ReactNode;
  label?: string;
};

type State = { hasError: boolean; error?: any };

export default class ClientErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('[ClientErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const msg =
      this.state.error?.message ||
      this.state.error?.toString?.() ||
      'Client error';
    return (
      <div
        dir="rtl"
        className="mx-auto my-6 max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 p-4 shadow"
      >
        <div className="text-sm opacity-70">
          {this.props.label || 'שגיאה ברכיב'}
        </div>
        <div className="mt-1 font-medium" style={{ direction: 'ltr' }}>
          {msg}
        </div>
        <button
          onClick={() => this.setState({ hasError: false, error: undefined })}
          className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800"
        >
          נסה לרענן את הרכיב
        </button>
      </div>
    );
  }
}
