// src/components/Hero3DClient.tsx
'use client'
import dynamic from 'next/dynamic'

const Hero3DInner = dynamic(() => import('./Hero3D'), {
  ssr: false,
  loading: () => <div className="card">טוען תלת־מימד…</div>,
})

export default function Hero3DClient() {
  return <Hero3DInner />
}
