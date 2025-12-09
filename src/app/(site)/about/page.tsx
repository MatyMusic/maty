import Link from "next/link";
import Image from "next/image";

/** ============================================================================
 *  ABOUT — MATY-MUSIC  (Server Component, App Router)
 *  - בלי "use client" כדי לאפשר export metadata
 *  - המון מקטעים, אנימציות CSS (טהור), קישורים, גלריה, טיימליין, FAQ, ציוד ועוד
 *  - RTL מלא
 *  - אנימציות: Tailwind + keyframes מקומית
 *  - מתוכנן לעבודה נקייה בלי JS/Hooks (שומר על metadata ו-SSR תקין)
 * ============================================================================ */

export const metadata = {
  title: "על MATY-MUSIC",
  description: "אודות — מתי גורפינקל (MG) והפרויקט MATY-MUSIC",
};

export default function AboutPage() {
  return (
    <section dir="rtl" className="section-padding">
      {/* ====== STYLE: keyframes & helpers ====== */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* === Animations === */
          @keyframes softFloat {
            0% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0); }
          }
          @keyframes gentlePulse {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.02); opacity: 1; }
          }
          @keyframes slideInUp {
            0% { transform: translateY(30px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes glow {
            0%, 100% { filter: drop-shadow(0 0 0 rgba(109,74,255,0)); }
            50% { filter: drop-shadow(0 0 14px rgba(109,74,255,0.35)); }
          }
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .anim-float { animation: softFloat 6s ease-in-out infinite; }
          .anim-pulse { animation: gentlePulse 4.5s ease-in-out infinite; }
          .anim-slide-up { animation: slideInUp .9s ease-out both; }
          .anim-glow { animation: glow 2.8s ease-in-out infinite; }
          .anim-delay-1 { animation-delay: .15s }
          .anim-delay-2 { animation-delay: .3s }
          .anim-delay-3 { animation-delay: .45s }
          .anim-delay-4 { animation-delay: .6s }
          .marquee {
            white-space: nowrap;
            overflow: hidden;
            position: relative;
          }
          .marquee > div {
            display: inline-block;
            padding-right: 2rem;
            animation: marquee 18s linear infinite;
          }
          /* helpers */
          .about-card {
            border-radius: 1.25rem;
            border: 1px solid rgba(100,116,139,0.15);
            background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.82));
          }
          .about-card.dark {
            border-color: rgba(255,255,255,0.12);
            background: linear-gradient(180deg, rgba(17,17,17,0.92), rgba(17,17,17,0.82));
          }
          .ringed {
            box-shadow:
              0 0 0 2px rgba(109,74,255,0.15),
              0 10px 25px -10px rgba(109,74,255,0.35);
          }
          .chip {
            border: 1px solid rgba(100,116,139,0.25);
            background: rgba(255,255,255,0.65);
          }
          .chip.dark {
            border-color: rgba(255,255,255,0.15);
            background: rgba(17,17,17,0.6);
          }
        `,
        }}
      />

      <div className="container-section">
        {/* =================== HERO =================== */}
        <section className="relative mb-8 md:mb-12">
          {/* BG */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-90 dark:opacity-60"
          >
            <div
              className="absolute inset-x-0 -top-16 mx-auto h-[220px] w-[min(100%,780px)] rounded-[48px] blur-3xl"
              style={{
                background:
                  "radial-gradient(80% 60% at 50% 50%, rgba(109,74,255,0.3), rgba(109,74,255,0) 60%)",
              }}
            />
            <div
              className="absolute inset-x-0 top-24 mx-auto h-[240px] w-[min(100%,920px)] rounded-[48px] blur-3xl"
              style={{
                background:
                  "radial-gradient(60% 50% at 50% 50%, rgba(255,134,98,0.25), rgba(255,134,98,0) 68%)",
              }}
            />
          </div>

          <div className="about-card dark:bg-neutral-950/90 bg-white/90 backdrop-blur shadow-xl border dark:border-white/10 p-5 md:p-7 ringed anim-slide-up">
            <div className="flex items-start justify-between gap-6">
              {/* text */}
              <div className="flex-1 text-right">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 md:mb-4 anim-glow">
                  על{" "}
                  <span className="text-violet-600 dark:text-violet-400">
                    MATY-MUSIC
                  </span>
                </h1>
                <p className="opacity-90 leading-7 md:text-lg">
                  אני <b>מתי גורפינקל (MG)</b>, <b>נגן קלידים</b> ומפיק במה
                  לאירועים. אנחנו מרימים חוויה חיה, עם סאונד מקצועי, פלייליסטים
                  מותאמים לקהל, והובלת רחבה חכמה — מהניגון החסידי ועד ים-תיכוני
                  וסטים מקפיצים.
                </p>

                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/90 dark:bg-neutral-950/80 anim-float">
                    <div className="font-semibold mb-1">מה אנחנו עושים</div>
                    <ul className="text-sm opacity-80 space-y-1">
                      <li>• הופעות חיות לאירועים</li>
                      <li>• חופות / שירת מקהלות</li>
                      <li>• ניהול במה והפקה מוזיקלית</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/90 dark:bg-neutral-950/80 anim-float anim-delay-1">
                    <div className="font-semibold mb-1">סגנונות</div>
                    <ul className="text-sm opacity-80 space-y-1">
                      <li>• חסידי וחב״ד</li>
                      <li>• מזרחי / ים-תיכוני</li>
                      <li>• בלדות שקטות / סטים מקפיצים</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/90 dark:bg-neutral-950/80 anim-float anim-delay-2">
                    <div className="font-semibold mb-1">למה אנחנו</div>
                    <ul className="text-sm opacity-80 space-y-1">
                      <li>• התאמה מלאה לקהל</li>
                      <li>• סאונד נקי ומדויק</li>
                      <li>• אנרגיה ומקצועיות על הבמה</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-2">
                  <Link href="/contact" className="btn">
                    צור קשר
                  </Link>
                  <Link href={{ pathname: "/", hash: "demos" }} className="btn">
                    דמואים
                  </Link>
                  <Link href="/events" className="btn">
                    הזמנת הופעה
                  </Link>
                </div>
              </div>

              {/* avatar / logo */}
              <div className="shrink-0 text-center">
                {/* אם האווטאר שלך מוכן ומונח ב-/assets/images/maty-avatar.png זה יוצג; אחרת הלוגו */}
                <div className="relative">
                  <div
                    className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 blur-xl"
                    aria-hidden
                  />
                  <Image
                    src="/assets/images/maty-avatar.png"
                    alt="MATY avatar"
                    width={220}
                    height={220}
                    className="w-36 md:w-44 h-auto rounded-3xl border dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 anim-pulse ringed"
                    priority
                  />
                </div>

                <div className="mt-2 opacity-70 text-sm">MG • Keyboards</div>

                <div className="mt-4 hidden md:block">
                  <Image
                    src="/assets/logo/mg-mark.svg"
                    alt="MG Logo"
                    width={160}
                    height={160}
                    className="w-28 md:w-36 h-auto opacity-90"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================== QUICK CHIPS =================== */}
        <section className="mb-10">
          <div className="flex flex-wrap gap-2 justify-end">
            {[
              { label: "חב״ד / חסידי", href: "/genre?tag=chabad" },
              { label: "ים-תיכוני", href: "/genre?tag=mizrahi" },
              { label: "בלדות שקטות", href: "/genre?tag=soft" },
              { label: "סטים מקפיצים", href: "/genre?tag=party" },
              { label: "וידאו-דמואים", href: "/videos" },
              { label: "גלריה", href: "/gallery" },
              { label: "הזמנת הופעה", href: "/events" },
            ].map((c, i) => (
              <Link
                key={c.label}
                href={c.href}
                className="chip dark rounded-full px-3 py-1 text-sm hover:opacity-100 opacity-90 transition anim-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </section>

        {/* =================== STRIPS / MARQUEE =================== */}
        <section className="mb-12">
          <div className="marquee about-card dark bg-white/80 dark:bg-neutral-950/70 backdrop-blur p-3 md:p-4 border dark:border-white/10">
            <div className="opacity-80">
              • MATY-MUSIC • אירועים • חתונות • חופות • התוועדויות • מוזיקה חיה
              • קלידים • פלייליסט מותאם • סאונד מקצועי • חוויה אינטראקטיבית •
              MATY-CLUB • MATY-DATE • • MATY-MUSIC • אירועים • חתונות • חופות •
              התוועדויות • מוזיקה חיה • קלידים • פלייליסט מותאם • סאונד מקצועי •
              חוויה אינטראקטיבית • MATY-CLUB • MATY-DATE •
            </div>
          </div>
        </section>

        {/* =================== CORE MODULES =================== */}
        <section className="mb-14">
          <header className="mb-5">
            <h2 className="text-2xl md:text-3xl font-extrabold">
              הליבה של המותג
            </h2>
            <p className="opacity-80">שלושה מודולים שמרכיבים את החוויה</p>
          </header>

          <div className="grid md:grid-cols-3 gap-5">
            {/* MUSIC */}
            <article className="about-card dark p-5 border dark:border-white/10 anim-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">MATY-MUSIC</h3>
                <span className="text-xs opacity-60">מוזיקה חיה</span>
              </div>
              <p className="opacity-80 mt-2 text-sm leading-7">
                בית לכל מה שמוזיקלי במותג — דמואים, רשימות השמעה, ויז׳ואלס,
                חבילות אירוע והשראות. החזון: חוויה בינלאומית ונקיה שמציגה איכות.
              </p>
              <ul className="text-sm opacity-80 space-y-1 mt-3">
                <li>• נגן חכם עם רשימות</li>
                <li>• קטלוג סגנונות חי</li>
                <li>• חבילות לאירוע מותאם</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <Link className="btn" href="/genre">
                  כנסו לשירים
                </Link>
                <Link className="btn" href="/events">
                  הזמנת הופעה
                </Link>
              </div>
            </article>

            {/* DATE */}
            <article className="about-card dark p-5 border dark:border-white/10 anim-slide-up anim-delay-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">MATY-DATE</h3>
                <span className="text-xs opacity-60">שידוכים חכמים</span>
              </div>
              <p className="opacity-80 mt-2 text-sm leading-7">
                שכבת התאמות שמזהה מכנה משותף: זרם ביהדות, עיר, דפוסי האזנה ועוד.
                רשת סגורה, כניסה באישור בלבד, מודרציה חזקה.
              </p>
              <ul className="text-sm opacity-80 space-y-1 mt-3">
                <li>• התאמות לפי סגנון ושמיעה</li>
                <li>• פרטיות ובטיחות בקהילה</li>
                <li>• אפשרות לצ׳טים/וידאו בעתיד</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <Link className="btn" href="/date">
                  בואו להכיר
                </Link>
                <Link className="btn" href="/about#faq">
                  שאלות ותשובות
                </Link>
              </div>
            </article>

            {/* CLUB */}
            <article className="about-card dark p-5 border dark:border-white/10 anim-slide-up anim-delay-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">MATY-CLUB</h3>
                <span className="text-xs opacity-60">רשת חברתית נקיה</span>
              </div>
              <p className="opacity-80 mt-2 text-sm leading-7">
                פיד בטוח ומסונן: פוסטים, לייקים, תגובות, שיתופים. יכולות מתקדמות
                נפתחות לפי מנוי—וידאו ולייב בהמשך.
              </p>
              <ul className="text-sm opacity-80 space-y-1 mt-3">
                <li>• פיד עם מודרציה</li>
                <li>• הפעלות קהילה</li>
                <li>• מתנות/תמיכה ביוצר</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <Link className="btn" href="/club">
                  פתחו פרופיל
                </Link>
                <Link className="btn" href="/pricing">
                  מחירים
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* =================== VIDEO DEMOS =================== */}
        <section className="mb-14">
          <header className="mb-5">
            <h2 className="text-2xl md:text-3xl font-extrabold">
              וידאו דמואים
            </h2>
            <p className="opacity-80">לינקים מהירים לקליפים / הופעות</p>
          </header>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "חופה — נעימה חסידית",
                href: "/videos?clip=chuppah-1",
                cover: "/assets/videos/covers/chuppah-1.jpg",
              },
              {
                title: "סט מקפיץ — ים-תיכוני",
                href: "/videos?clip=party-2",
                cover: "/assets/videos/covers/party-2.jpg",
              },
              {
                title: "התוועדות — nigunim",
                href: "/videos?clip=farbrengen-3",
                cover: "/assets/videos/covers/farbrengen-3.jpg",
              },
            ].map((v, idx) => (
              <Link
                key={v.title}
                href={v.href}
                className="group relative block rounded-2xl overflow-hidden border dark:border-white/10"
              >
                <Image
                  src={v.cover}
                  alt={v.title}
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70" />
                <div className="absolute bottom-0 right-0 p-4 text-white">
                  <div className="text-sm opacity-90">צפו עכשיו</div>
                  <div className="text-lg font-bold">{v.title}</div>
                </div>
                <div
                  aria-hidden
                  className="absolute left-3 top-3 rounded-full bg-black/60 text-white text-xs px-2 py-1"
                >
                  וידאו
                </div>
                <div
                  aria-hidden
                  className="absolute right-3 top-3 rounded-full bg-white/80 text-black text-xs px-2 py-1"
                >
                  חדש
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =================== GALLERY =================== */}
        <section className="mb-14">
          <header className="mb-5">
            <h2 className="text-2xl md:text-3xl font-extrabold">גלריה</h2>
            <p className="opacity-80">במה, קהל, רגעים של אנרגיה</p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "/assets/gallery/01.jpg",
              "/assets/gallery/02.jpg",
              "/assets/gallery/03.jpg",
              "/assets/gallery/04.jpg",
              "/assets/gallery/05.jpg",
              "/assets/gallery/06.jpg",
              "/assets/gallery/07.jpg",
              "/assets/gallery/08.jpg",
            ].map((g, i) => (
              <Link
                key={g}
                href={`/gallery?img=${encodeURIComponent(g)}`}
                className="group relative block overflow-hidden rounded-2xl border dark:border-white/10"
              >
                <Image
                  src={g}
                  alt={`גלריה ${i + 1}`}
                  width={500}
                  height={500}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition"
                />
              </Link>
            ))}
          </div>

          <div className="mt-4 text-right">
            <Link href="/gallery" className="btn">
              עוד גלריה
            </Link>
          </div>
        </section>

        {/* =================== STATS =================== */}
        <section className="mb-14">
          <header className="mb-5">
            <h2 className="text-2xl md:text-3xl font-extrabold">
              מספרים שמספרים סיפור
            </h2>
            <p className="opacity-80">מבוסס על הופעות/דמואים וכלי עבודה</p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                label: "אירועים בשנה",
                value: "80+",
                hint: "חתונות • חופות • קהילות",
              },
              {
                label: "קטלוג שירים",
                value: "9000+",
                hint: "ניגונים וים-תיכוני",
              },
              { label: "סאונד-סיסטם", value: "RCF/JBL", hint: "935-A / PRX" },
              { label: "קלידים", value: "KORG Pa5X MG", hint: "סטים מותאמים" },
            ].map((s, idx) => (
              <div
                key={s.label}
                className="about-card dark p-5 border dark:border-white/10 text-right anim-slide-up"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="text-3xl md:text-4xl font-extrabold">
                  {s.value}
                </div>
                <div className="opacity-90">{s.label}</div>
                <div className="opacity-60 text-sm">{s.hint}</div>
              </div>
            ))}
          </div>
        </section>

        {/* =================== TIMELINE =================== */}
        <section className="mb-14">
          <header className="mb-5">
            <h2 className="text-2xl md:text-3xl font-extrabold">הדרך</h2>
            <p className="opacity-80">נקודות ציון קצרות</p>
          </header>

          <ol className="relative border-s border-slate-200 dark:border-white/10 ps-5 space-y-6">
            {[
              {
                title: "התחלה על הבמות",
                desc: "הפקות קטנות/קהילתיות — חיפוש סאונד נכון ועבודה עם קהל.",
                year: "2014–2017",
              },
              {
                title: "הקמה רשמית של MATY-MUSIC",
                desc: "מיתוג, הצטיידות מקצועית, בניית קטלוג שירים, והופעות קבועות.",
                year: "2018–2021",
              },
              {
                title: "הרחבה דיגיטלית",
                desc: "אתר עם נגן, גלריות, וקונספטים של MATY-CLUB / DATE.",
                year: "2022–2024",
              },
              {
                title: "היום",
                desc: "במה חיה, קהילה נקיה, ופרויקטים חדשים סביב מוזיקה חיה.",
                year: "2025",
              },
            ].map((t, i) => (
              <li
                key={t.title}
                className="anim-slide-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="absolute -right-[7px] mt-1 size-3 rounded-full bg-violet-500 ring-4 ring-white dark:ring-neutral-900" />
                <div className="ms-4">
                  <div className="text-sm opacity-60">{t.year}</div>
                  <h3 className="text-lg font-bold">{t.title}</h3>
                  <p className="opacity-85 leading-7">{t.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* =================== GEAR / SETUP =================== */}
        <section className="mb-14" id="gear">
          <header className="mb-5">
            <h2 className="text-2xl md:text-3xl font-extrabold">ציוד במה</h2>
            <p className="opacity-80">בחירות מדויקות לסאונד חי</p>
          </header>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="about-card dark p-5 border dark:border-white/10">
              <h3 className="font-bold text-lg">Keys & Sound</h3>
              <ul className="opacity-85 text-sm leading-8">
                <li>• Korg Pa5X MG — סטים/קומבינציות מותאמות</li>
                <li>• מיקסר עם הקלטה ושליטה מלאה</li>
                <li>• RCF ART 935-A / JBL PRX</li>
                <li>• מיקרופונים דינמיים/קונדנסר לפי הצורך</li>
                <li>• כבלים/סטנדים K&M, סידור במה נקי</li>
              </ul>
            </div>
            <div className="about-card dark p-5 border dark:border-white/10">
              <h3 className="font-bold text-lg">Stage Flow</h3>
              <ul className="opacity-85 text-sm leading-8">
                <li>• בניית פלייליסט חכם לפי קהל וזמן</li>
                <li>• מעבר חלק בין ניגונים/ים-תיכוני</li>
                <li>• אינטראקציה שקולה עם הקהל</li>
                <li>• סטים קצרים/ארוכים לפי האירוע</li>
                <li>• תאום מלא עם מפיק/צלם</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 text-right">
            <Link href="/about#faq" className="btn">
              לשאלות נפוצות
            </Link>
          </div>
        </section>

        {/* =================== TESTIMONIALS (CSS-only) =================== */}
        <section className="mb-14">
          <header className="mb-5">
            <h2 className="text-2xl md:text-3xl font-extrabold">מה אומרים</h2>
            <p className="opacity-80">הבמות מספרות</p>
          </header>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                q: "רחבה חיה בלי לעצור רגע — בדיוק מה שרצינו!",
                a: "חתונת חב״ד • ירושלים",
              },
              {
                q: "שליטה מושלמת בדינמיקה של הערב, סאונד נקי.",
                a: "אירוע קהילה • מרכז",
              },
              {
                q: "שילוב חסידי-ים-תיכוני שעובד פשוט מצוין.",
                a: "בר-מצווה • צפון",
              },
            ].map((t, i) => (
              <figure
                key={t.q}
                className="about-card dark p-5 border dark:border-white/10 anim-slide-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <blockquote className="leading-7">“{t.q}”</blockquote>
                <figcaption className="opacity-70 text-sm mt-2">
                  — {t.a}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* =================== FAQ =================== */}
        <section className="mb-16" id="faq">
          <header className="mb-5">
            <h2 className="text-2xl md:text-3xl font-extrabold">
              שאלות נפוצות
            </h2>
            <p className="opacity-80">הכי שקוף והכי פשוט</p>
          </header>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                q: "איך בוחרים סט לאירוע?",
                a: "נבנה פלייליסט לפי סגנון הקהל, סוג האירוע והדגשים שלך. בשטח מתאימים דינמיקה.",
              },
              {
                q: "אפשר דמואים לפני?",
                a: "כן — יש עמוד וידאו/דמואים ותמיד אשמח לשלוח לינקים נוספים.",
              },
              {
                q: "כמה זמן נגן?",
                a: "בדרך כלל 2–4 סטים, 25–45 דקות כל אחד. זה דינמי לפי הערב.",
              },
              {
                q: "תמחור?",
                a: "תלוי במיקום, ציוד, משך, ותאריך. דברו ונבנה חבילה שמתאימה.",
              },
            ].map((f, i) => (
              <details
                key={f.q}
                className="about-card dark p-4 md:p-5 border dark:border-white/10 anim-slide-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <summary className="cursor-pointer text-lg font-semibold">
                  {f.q}
                </summary>
                <div className="opacity-85 mt-2 leading-7">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* =================== CTA =================== */}
        <section className="mb-10">
          <div className="about-card dark p-6 md:p-8 border dark:border-white/10 ringed">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-1 text-right">
                <h3 className="text-2xl md:text-3xl font-extrabold">
                  בואו נרים במה • ביחד
                </h3>
                <p className="opacity-80 mt-1">
                  נבנה פלייליסט על פי הקהל שלכם וננהל את האנרגיה מתחילת הערב עד
                  הסוף.
                </p>
              </div>
              <div className="flex gap-2">
                <Link className="btn" href="/events">
                  הזמנת הופעה
                </Link>
                <Link className="btn" href="/contact">
                  צור קשר
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =================== FOOT NAV =================== */}
        <nav
          aria-label="קישורים מהירים"
          className="flex flex-wrap gap-3 justify-end opacity-90"
        >
          {[
            { href: "/", label: "בית" },
            { href: "/genre", label: "שירים" },
            { href: "/videos", label: "וידאו" },
            { href: "/gallery", label: "גלריה" },
            { href: "/events", label: "הזמנת הופעה" },
            { href: "/club", label: "MATY-CLUB" },
            { href: "/date", label: "MATY-DATE" },
            { href: "/contact", label: "צור קשר" },
            { href: "/about#gear", label: "ציוד" },
            { href: "/about#faq", label: "FAQ" },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="chip dark rounded-full px-3 py-1 text-sm"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
