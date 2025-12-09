// src/components/ClientDebug.tsx
'use client';

import { useEffect } from 'react';

export default function ClientDebug() {
  useEffect(() => {
    const onError = (message: any, source?: any, lineno?: any, colno?: any, error?: any) => {
      console.error('[window.onerror]', { message, source, lineno, colno, error });
      return false; // אל תבלע שגיאה
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      console.error('[unhandledrejection]', e?.reason);
    };

    window.addEventListener('error', onError as any);
    window.addEventListener('unhandledrejection', onRejection);

    console.log('%c[ClientDebug] attached', 'color:#0b8;');
    return () => {
      window.removeEventListener('error', onError as any);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
