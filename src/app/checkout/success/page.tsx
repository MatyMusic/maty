export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function CheckoutSuccess({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const ref = Array.isArray(sp.ref) ? sp.ref[0] : sp.ref;

  return (
    <section className="section-padding">
      <div className="container-section max-w-2xl">
        <div className="card text-center">
          <h1 className="text-3xl font-extrabold mb-2">התשלום הושלם!</h1>

          <p className="mb-1">תודה רבה 🙏 ההזמנה עודכנה במצב “שולמה”.</p>
          <p className="text-sm text-slate-500 mb-4">
            נשלח אליך <b>אימייל סופי</b> עם כל הפרטים וקובץ PDF מצורף.
            אם לא מופיע הדוא״ל—בדוק/י דואר זבל או פנה/י אלינו.
          </p>

          {ref && (
            <p className="text-xs text-slate-500 mb-4">
              מזהה הזמנה: <code className="px-2 py-1 rounded bg-black/5 dark:bg-white/10">{ref}</code>
            </p>
          )}

          <div className="flex justify-center gap-2">
            <a href="/orders" className="btn">דף הזמנות</a>
            <a href="/" className="btn">דף הבית</a>
          </div>
        </div>
      </div>
    </section>
  );
}
