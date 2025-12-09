// src/components/DebugErrorOverlay.tsx
'use client'
import { useEffect, useState } from 'react'

export default function DebugErrorOverlay() {
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const onErr = (e: ErrorEvent) => setErr(e.message || String(e.error ?? 'Error'))
    const onRej = (e: PromiseRejectionEvent) => setErr(e.reason?.message || String(e.reason))
    window.addEventListener('error', onErr)
    window.addEventListener('unhandledrejection', onRej)
    return () => {
      window.removeEventListener('error', onErr)
      window.removeEventListener('unhandledrejection', onRej)
    }
  }, [])

  if (!err) return null
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.85)',
      color:'#fff', zIndex:999999, padding:20, fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas'
    }}>
      <div style={{maxWidth:900, margin:'40px auto'}}>
        <h2 style={{marginBottom:8}}>First runtime error</h2>
        <pre style={{whiteSpace:'pre-wrap'}}>{err}</pre>
        <p style={{opacity:.75, marginTop:12}}>פתח Console → תראה גם את ה-stack המלא שם.</p>
      </div>
    </div>
  )
}
