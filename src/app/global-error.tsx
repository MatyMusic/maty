// src/app/global-error.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; cause?: unknown };
  reset: () => void;
}) {
  // נלכוד את ההודעה/סטאק/קוז לוג ברור
  useEffect(() => {
    console.error('[GlobalError] message:', error?.message);
    if ((error as any)?.cause) console.error('[GlobalError] cause:', (error as any).cause);
    if (error?.stack) console.error('[GlobalError] stack:', error.stack);
    if ((error as any)?.digest) console.error('[GlobalError] digest:', (error as any).digest);
  }, [error]);

  const [copied, setCopied] = useState(false);

  const details = useMemo(() => {
    return [
      `message: ${error?.message ?? ''}`,
      `digest: ${(error as any)?.digest ?? ''}`,
      `cause: ${JSON.stringify((error as any)?.cause ?? null)}`,
      `stack:\n${error?.stack ?? ''}`,
    ].join('\n');
  }, [error]);

  return (
    <html>
      <body dir="rtl" style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 16,
            padding: 20,
            background: 'rgba(255,255,255,0.92)',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22 }}>שגיאה גלובלית</h1>

          <p style={{ marginTop: 8, opacity: 0.8 }}>הודעת השגיאה:</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              direction: 'ltr',
              background: '#f6f7f9',
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.06)',
              maxHeight: 260,
              overflow: 'auto',
            }}
          >
            {error?.message || 'Unknown error'}
          </pre>

          <details style={{ marginTop: 10 }}>
            <summary>פרטי דיבוג (stack / digest / cause)</summary>
            <pre
              style={{
                marginTop: 8,
                whiteSpace: 'pre-wrap',
                direction: 'ltr',
                background: '#f6f7f9',
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.06)',
                maxHeight: 360,
                overflow: 'auto',
              }}
            >
{details}
            </pre>
          </details>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={() => { copy(details); setCopied(true); setTimeout(()=>setCopied(false), 1500); }}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(0,0,0,0.12)',
                padding: '8px 14px',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              {copied ? 'הועתק ✓' : 'העתק פרטים'}
            </button>
            <button
              onClick={() => reset()}
              style={{
                borderRadius: 999,
                border: '1px solid rgba(0,0,0,0.12)',
                padding: '8px 14px',
                background: 'black',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              נסה שוב
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
