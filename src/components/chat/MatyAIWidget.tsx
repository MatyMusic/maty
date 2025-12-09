'use client'

import { useEffect, useRef, useState } from 'react'
import { CONTACT } from '@/lib/constants'

type Msg = { role: 'user' | 'assistant'; content: string }

type Props = {
  initialOpen?: boolean
  bottomOffset?: number // px
  rightOffset?: number  // px
  widthPx?: number      // כיוון גודל – דסקטופ
  maxHeightVh?: number  // גובה מירבי באחוזי חלון
  whatsappHref?: string
}

export default function MatyAIWidget({
  initialOpen = false,
  bottomOffset = 16,
  rightOffset = 16,
  widthPx = 340,
  maxHeightVh = 56,
  whatsappHref = CONTACT.whatsapp,
}: Props) {
  const [open, setOpen] = useState(initialOpen)
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: 'אהלן! אני MATY-AI 🤖 איך אפשר לעזור?' },
  ])
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // גלילה לסוף
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, open])

  // שימור מצב בלוקאל (קטנטן)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('maty-ai:msgs')
      const opened = localStorage.getItem('maty-ai:open')
      if (saved) setMsgs(JSON.parse(saved))
      if (opened) setOpen(opened === '1')
    } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem('maty-ai:msgs', JSON.stringify(msgs)) } catch {} }, [msgs])
  useEffect(() => { try { localStorage.setItem('maty-ai:open', open ? '1' : '0') } catch {} }, [open])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setMsgs(m => [...m, { role: 'user', content: text }])
    setInput('')
    setBusy(true)
    try {
      const r = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...msgs, { role: 'user', content: text }] }),
      })
      const { reply } = await r.json()
      setMsgs(m => [...m, { role: 'assistant', content: reply || '🙂' }])
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'הייתה תקלה קטנה. נסו שוב.' }])
    } finally {
      setBusy(false)
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); send() }
  }

  // מדד למובייל: אם המסך צר מ־480px – הופך לתחתית מלאה
  const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 480px)').matches

  return (
    <>
      {/* כפתור לוחץ קטן */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed z-[10000] grid place-items-center rounded-full shadow-lg bg-brand text-white hover:opacity-90"
        style={{
          width: 52, height: 52,
          right: rightOffset, bottom: bottomOffset,
        }}
        aria-label={open ? 'סגור צ׳אט MATY-AI' : 'פתח צ׳אט MATY-AI'}
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* חלון קומפקטי */}
      {!open ? null : (
        <div
          className="fixed z-[9999] rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 shadow-2xl overflow-hidden"
          style={
            isMobile
              ? { left: 0, right: 0, bottom: 0, height: '60vh' }
              : { right: rightOffset, bottom: bottomOffset + 52 + 8, width: Math.min(widthPx, 380), maxHeight: `${maxHeightVh}vh` }
          }
          role="dialog"
          aria-modal="true"
        >
          {/* כותרת מינימלית */}
          <div className="px-3 py-2 border-b border-black/10 dark:border-white/10 text-sm flex items-center justify-between">
            <div className="font-semibold">MATY-AI</div>
            <a className="text-emerald-600 hover:underline" href={whatsappHref} target="_blank" rel="noreferrer">וואטסאפ</a>
          </div>

          {/* הודעות – טקסט קטן וריווח מינימלי */}
          <div className="overflow-y-auto p-2 space-y-1.5 text-right text-[13px]" style={{ maxHeight: isMobile ? undefined : `calc(${maxHeightVh}vh - 92px)` }}>
            {msgs.map((m, i) => (
              <div key={i} className="text-right">
                <div className={`inline-block max-w-[92%] rounded-2xl px-2.5 py-1.5 leading-5 ${
                  m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-black/5 dark:bg-white/10'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* קלט חד-שורה קומפקטי */}
          <div className="p-2 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="כתוב הודעה…"
                className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500 text-[13px]"
              />
              <button
                onClick={send}
                disabled={busy}
                className="rounded-xl px-3 py-2 text-[13px] font-semibold bg-brand text-white hover:opacity-90 disabled:opacity-60"
              >
                {busy ? '...' : 'שלח'}
              </button>
            </div>

            {/* תגובות מהירות (קטנות) */}
            <div className="mt-1 flex flex-wrap gap-1">
              {['מחיר בסיס', 'תאריך פנוי', 'הופעה חסידי/מזרחי', 'ציוד הגברה'].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-full border border-black/10 dark:border-white/10 px-2.5 py-1 text-[12px] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
