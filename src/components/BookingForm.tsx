'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  calcQuote, CATEGORY_LABEL, BASE_PRICE,
  type CategoryKey, type QuoteBreakdown
} from '@/lib/pricing'
import { CONTACT } from '@/lib/constants'

const CATS: CategoryKey[] = ['chabad','mizrahi','soft','fun']
const fmt = new Intl.NumberFormat('he-IL')
const todayISO = () => new Date(Date.now()+12*3600*1000).toISOString().slice(0,10)

type BookingsApiOk  = { ok: true; id: string; pdfUrl: string }
type BookingsApiErr = { ok: false; error?: string; message?: string }
type BookingsApiRes = BookingsApiOk | BookingsApiErr

export default function BookingForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const rawCat = sp.get('category')
  const initialCat: CategoryKey = rawCat && (CATS as string[]).includes(rawCat) ? (rawCat as CategoryKey) : 'fun'

  // פרטי הזמנה
  const [category, setCategory] = useState<CategoryKey>(initialCat)
  const [dateISO, setDateISO] = useState<string>('')
  const [hours, setHours] = useState<number>(6)
  const [guests, setGuests] = useState<number>(150)
  const [distanceKm, setDistanceKm] = useState<number>(0)

  // תוספים
  const [soundSystem, setSoundSystem] = useState(false)
  const [extraMusicians, setExtraMusicians] = useState(0)

  // לקוח
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // הערות
  const [notes, setNotes] = useState('')

  // מצב
  const [sent, setSent] = useState<'ok'|'err'|null>(null)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [installments, setInstallments] = useState<number>(1)
  const [bookingRes, setBookingRes] = useState<BookingsApiOk | null>(null)

  // סנכרון קטגוריה ל־URL
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('category', category)
    router.replace(url.toString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  // חישוב מחיר
  const breakdown: QuoteBreakdown | null = useMemo(() => {
    if (!dateISO) return null
    return calcQuote({
      category, dateISO, hours, guests, distanceKm,
      addons: { soundSystem, extraMusicians },
    })
  }, [category, dateISO, hours, guests, distanceKm, soundSystem, extraMusicians])

  const perInstallment = breakdown && installments > 1
    ? Math.ceil(breakdown.total / installments)
    : null

  // PDF הצעת מחיר (לא אישור)
  async function downloadQuotePdf() {
    try {
      setPdfLoading(true)
      const payload = {
        category, dateISO, hours, guests, distanceKm,
        addons: { soundSystem, extraMusicians }, breakdown
      }
      const res = await fetch('/api/quote', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('pdf failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'maty-quote.pdf'; a.style.display='none'
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch {
      alert('לא הצלחתי להפיק PDF כרגע')
    } finally {
      setPdfLoading(false)
    }
  }

  async function payNow() {
    if (!breakdown) return alert('בחר תאריך כדי לחשב מחיר.')
    if (!fullName || !phone) return alert('מלא שם וטלפון לפני תשלום.')
    setPayLoading(true)
    try {
      const orderId = `MATY-${Date.now()}`
      const total = breakdown.total
      const qs = new URLSearchParams({ orderId, amount: String(total) }).toString()
      router.push(`/checkout?${qs}`)
    } finally { setPayLoading(false) }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setSent(null); setBookingRes(null)

    // הסכום שנשלח ל-API (אם אין breakdown נשתמש בבסיס לפי קטגוריה)
    const amount = breakdown?.total ?? BASE_PRICE[category]

    try {
      // שים לב: שולחים ל-/api/bookings כפי שנבנה בשרת
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          eventDate: dateISO,
          amount,
          note: notes,
          // מידע משלים (לא חובה ל-API, אבל נשמר לעתיד אם תרחיב):
          meta: {
            category, hours, guests, distanceKm,
            addons: { soundSystem, extraMusicians },
            installments,
            breakdown,
          },
        }),
      })

      const json: BookingsApiRes = await res.json()

      if (!res.ok || !json.ok) throw new Error((json as BookingsApiErr).message || 'send failed')

      setBookingRes(json)       // מכיל id ו-pdfUrl
      setSent('ok')
    } catch {
      setSent('err')
    } finally {
      setLoading(false)
    }
  }

  const waText = encodeURIComponent(
`הזמנת הופעה — MATY-MUSIC
קטגוריה: ${CATEGORY_LABEL[category]}
תאריך: ${dateISO || '—'}
משך: ${hours} שעות
קהל: ${guests}
מרחק נסיעה: ${distanceKm} ק״מ
תוספים: ${[
  soundSystem && 'הגברה',
  extraMusicians>0 && \`+\${extraMusicians} נגנים\`,
].filter(Boolean).join(', ') || '—'}
${breakdown ? \`מחיר משוער: ₪\${fmt.format(breakdown.total)}\` : \`מחיר בסיס: ₪\${fmt.format(BASE_PRICE[category])}\`}
—
שם: ${fullName || '—'}
טלפון: ${phone || '—'}
אימייל: ${email || '—'}
הערות: ${notes || '—'}`
  )

  return (
    <section className="section-padding">
      <div className="container-section">
        <div className="grid md:grid-cols-2 gap-6">
          {/* טופס */}
          <form className="card grid gap-3 text-right" onSubmit={submit}>
            <h1 className="text-3xl font-extrabold">הזמן הופעה</h1>
            <p className="opacity-80 -mt-1">בסיס 6 שעות — כל שעה נוספת ₪200. הגברה ו/או נגנים לפי בחירה.</p>

            {/* קטגוריה */}
            <label className="grid gap-1">
              <span className="text-sm opacity-80">קטגוריה</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATS.map((k) => (
                  <button
                    type="button" key={k}
                    className={`btn w-full ${category === k ? 'ring-2 ring-brand bg-white/70 dark:bg-white/10' : ''}`}
                    onClick={() => setCategory(k)}
                  >
                    {CATEGORY_LABEL[k]}
                  </button>
                ))}
              </div>
            </label>

            {/* תאריך + שעות */}
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm opacity-80">תאריך</span>
                <input required type="date" min={todayISO()} value={dateISO}
                       onChange={(e) => setDateISO(e.target.value)} className="input-base input-rtl" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm opacity-80">משך (שעות)</span>
                <input type="number" min={1} max={24} value={hours}
                       onChange={(e) => setHours(Number(e.target.value || 0))} className="input-base input-ltr" />
              </label>
            </div>

            {/* קהל + מרחק */}
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm opacity-80">גודל קהל (משוער)</span>
                <input type="number" min={1} value={guests}
                       onChange={(e) => setGuests(Number(e.target.value || 0))} className="input-base input-ltr" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm opacity-80">מרחק (ק״מ) — מעל 100 ק״מ תוספת ₪100</span>
                <input type="number" min={0} value={distanceKm}
                       onChange={(e) => setDistanceKm(Number(e.target.value || 0))} className="input-base input-ltr" />
              </label>
            </div>

            {/* תוספים */}
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex gap-2 items-center">
                <input type="checkbox" checked={soundSystem} onChange={(e) => setSoundSystem(e.target.checked)} />
                הגברה/סאונד (+₪500)
              </label>
              <label className="flex gap-2 items-center">
                נגנים נוספים:
                <input
                  type="number" min={0} value={extraMusicians}
                  onChange={(e) => setExtraMusicians(Number(e.target.value || 0))}
                  className="w-20 rounded-xl border px-3 py-1 bg-white/70 dark:bg-white/5 input-ltr focus:outline-none focus:ring-2 focus:ring-brand/60 border-slate-300 dark:border-white/10"
                />
                × ₪1,800
              </label>
            </div>

            {/* פרטי קשר */}
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="grid gap-1">
                <span className="text-sm opacity-80">שם מלא</span>
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-base input-rtl" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm opacity-80">טלפון</span>
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                       className="input-base input-ltr" inputMode="tel" pattern="[0-9+\-() ]{7,}" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm opacity-80">אימייל</span>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                       className="input-base input-ltr" inputMode="email" />
              </label>
            </div>

            {/* הודעת הצלחה – מתחת ל-INPUTs כמו שביקשת */}
            <div aria-live="polite">
              {sent === 'ok' && (
                <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  ✅ ההזמנה נקלטה ונשלח מייל ללקוח עם אישור ההזמנה ו־PDF מצורף.
                </p>
              )}
              {sent === 'err' && (
                <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-400">
                  ⚠︎ לא הצלחנו לשלוח מייל כרגע. נסה שוב מאוחר יותר.
                </p>
              )}
            </div>

            {/* הערות */}
            <label className="grid gap-1">
              <span className="text-sm opacity-80">הערות</span>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="input-base input-rtl rounded-2xl" />
            </label>

            {/* תשלומים */}
            <label className="grid gap-1">
              <span className="text-sm opacity-80">מספר תשלומים</span>
              <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))}
                      className="input-base input-ltr rounded-2xl">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>

            {/* פעולות */}
            <div className="flex flex-wrap justify-end gap-2">
              <a
                href={`https://wa.me/${CONTACT.phoneE164.replace('+','')}?text=${waText}`}
                target="_blank" rel="noopener noreferrer"
                className="btn bg-emerald-500 text-white border-0 hover:opacity-90"
              >
                שלח בוואטסאפ
              </a>

              <button
                type="button" className="btn"
                onClick={downloadQuotePdf}
                disabled={!breakdown || pdfLoading}
              >
                {pdfLoading ? 'מכין PDF…' : 'הורד הצעת מחיר (PDF)'}
              </button>

              {/* יופיע אחרי שליחה מוצלחת – אישור ההזמנה מה-API */}
              {bookingRes?.pdfUrl && (
                <a href={bookingRes.pdfUrl} target="_blank" className="btn" rel="noreferrer">
                  הורד אישור (PDF)
                </a>
              )}

              <button
                type="button" className="btn bg-brand text-white border-0 hover:opacity-90"
                onClick={payNow} disabled={!breakdown || payLoading}
              >
                {payLoading ? 'פותח תשלום…' : 'שלם עכשיו'}
              </button>

              <button className="btn" disabled={loading}>{loading ? 'שולח…' : 'שלח טופס'}</button>
            </div>
          </form>

          {/* סיכום מחיר */}
          <div className="card">
            <div className="text-right">
              <div className="text-2xl font-extrabold">הצעת מחיר חיה</div>
              <div className="opacity-80">מבוסס על הפרטים שמילאת</div>

              {!breakdown ? (
                <div className="mt-4 text-sm opacity-80">בחר תאריך כדי לחשב מחיר משוער.</div>
              ) : (
                <div className="mt-4 space-y-2 text-sm">
                  <Row label="בסיס" val={breakdown.base} />
                  <Row label="שעות נוספות" val={breakdown.extraHours} />
                  <Row label="קהל (מעל 1000)" val={breakdown.audience} />
                  <Row label="נסיעה (>100 ק״מ)" val={breakdown.travel} />
                  <Row label="תוספים" val={breakdown.addons} />
                  <Row label="סופ״ש" val={breakdown.weekend} />
                  <Row label="דחוף/מוקדם" val={breakdown.rush + breakdown.early} />
                  <hr className="my-2 border-white/10" />
                  <Row label="סיכום ביניים" val={breakdown.subtotal} />
                  <div className="text-lg font-extrabold mt-2">סה״כ משוער: ₪{fmt.format(breakdown.total)}</div>
                  {perInstallment && installments>1 && (
                    <div className="opacity-70 text-[13px]">({installments} תשלומים ≈ ₪{fmt.format(perInstallment)} לכל תשלום)</div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

function Row({ label, val }: { label: string; val: number }) {
  const fmt = new Intl.NumberFormat('he-IL')
  const sign = val >= 0 ? '' : '−'
  const n = Math.abs(val)
  return (
    <div className="flex items-center justify-between">
      <span className="opacity-80">{label}</span>
      <span className="font-semibold">₪{sign}{fmt.format(n)}</span>
    </div>
  )
}
