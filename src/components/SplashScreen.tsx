// src/components/SplashScreen.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashScreen() {
  const router = useRouter()
  const [visible, setVisible] = useState(true)
  const [fade, setFade] = useState(false)
  const [muted, setMuted] = useState(true)
  const [aboutOpen, setAboutOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hitRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    audioRef.current = new Audio('/audio/piano-loop.wav')
    audioRef.current.loop = true
    audioRef.current.volume = 0.9
    audioRef.current.muted = true
    audioRef.current.play().catch(() => {})
    hitRef.current = new Audio('/audio/maty-intro-hit.wav')
    hitRef.current.volume = 1
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      hitRef.current = null
    }
  }, [])

  function closeIntro(after?: () => void) {
    setFade(true)
    try { hitRef.current && hitRef.current.play() } catch {}
    setTimeout(() => {
      setVisible(false)
      audioRef.current?.pause()
      after?.()
    }, 420)
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m
      if (audioRef.current) {
        audioRef.current.muted = next
        if (!next) audioRef.current.play().catch(() => {})
      }
      return next
    })
  }

  const goRegister = () => closeIntro(() => router.push('/auth/register'))
  const goLogin    = () => closeIntro(() => router.push('/auth/login'))
  const goGuest    = () => closeIntro()

  if (!visible) return null

  return (
    <div className={`fixed inset-0 z-[90] grid place-items-center transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-[#0b0b0c]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_20%,rgba(108,92,231,0.25),rgba(0,0,0,0)_60%)]" />
      <div className="absolute w-[36rem] h-[36rem] rounded-full bg-gradient-to-br from-fuchsia-500/25 via-violet-500/20 to-sky-400/20 blur-3xl animate-pulse-slow" />

      <div className="relative text-center px-6">
        <img
          src="/assets/logo/maty-music-wordmark.svg"
          alt="MATY MUSIC"
          className="h-20 md:h-28 w-auto drop-shadow-[0_6px_28px_rgba(255,255,255,0.35)] animate-fade-up"
          draggable={false}
        />
        <div className="mt-3 md:mt-4 text-white/80">ברוכים הבאים לאתר של <b>MATY-MUSIC</b></div>

        {/* פסנתר “מנגן” */}
        <div className="mt-6 md:mt-8 flex justify-center">
          <div className="p-2 rounded-2xl bg-white/10 backdrop-blur border border-white/15">
            <div className="relative flex">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="w-6 h-16 md:h-20 bg-white rounded-b-sm mx-[1px] relative overflow-hidden">
                  <span
                    className="absolute inset-0 bg-black/90 w-3/5 h-9 rounded-b-sm left-1/2 -translate-x-1/2 animate-key"
                    style={{ animationDelay: `${(i % 7) * 0.12}s` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* כפתורים */}
        <div className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-3 md:gap-4">
          <button className="btn text-white border-white/20 bg-white/10 hover:bg-white/20" onClick={goRegister}>הירשם</button>
          <button className="btn text-white border-white/20 bg-white/10 hover:bg-white/20" onClick={goLogin}>כניסה</button>
          <button className="btn text-white border-white/20 hover:bg-white/10" onClick={goGuest}>המשך כאורח</button>

          <button
            className={`btn ${!muted ? 'ring-2 ring-fuchsia-400 text-white bg-white/10' : 'text-white border-white/20 hover:bg-white/10'}`}
            onClick={toggleMute}
            title="הפעל/השתק צליל"
          >
            {muted ? '🔇 צליל כבוי' : '🔊 צליל פועל'}
          </button>

          <button className="btn text-white border-white/20 hover:bg-white/10" onClick={() => setAboutOpen(true)}>ℹ️ על MATY-MUSIC</button>
        </div>
      </div>

      {/* מודאל “עלינו” (כמו גרסה קודמת) */}
      {aboutOpen && (
        <div className="fixed inset-0 z-[95] grid place-items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAboutOpen(false)} />
          <div className="relative w-[95%] max-w-2xl card text-right text-slate-100 bg-white/10 border border-white/15">
            <button onClick={() => setAboutOpen(false)} className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full border border-white/20 hover:bg-white/10" aria-label="סגור">✕ סגור</button>
            <div className="pr-2">
              <div className="text-2xl md:text-3xl font-extrabold mb-2">MATY-MUSIC — הופעות, הפקות, אנרגיה</div>
              <p className="opacity-90">אנחנו מביאים הופעות חיות לאירועים — סאונד חד, פלייליסט מותאם וחיבור לקהל.</p>
              <ul className="mt-3 space-y-2 opacity-90">
                <li>• סגנונות: חסידי/מזרחי/שקט/מקפיץ</li>
                <li>• לייב + לופים מותאמים</li>
                <li>• אפשרות להפקה מלאה</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href="/about" className="btn">קרא עוד</a>
                <a href="#contact" className="btn">צור קשר</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse-slow { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }

        @keyframes fade-up { 0%{opacity:0; transform:translateY(8px)} 100%{opacity:1; transform:translateY(0)} }
        .animate-fade-up { animation: fade-up .6s ease-out both; }

        @keyframes key { 0%,100% { transform: translateY(0); opacity: .9 } 50% { transform: translateY(6px); opacity: .6 } }
        .animate-key { animation: key 1.2s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-slow, .animate-fade-up, .animate-key { animation: none !important }
        }
      `}</style>
    </div>
  )
}
