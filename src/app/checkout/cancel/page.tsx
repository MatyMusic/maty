export default function CancelPage({
  searchParams,
}: { searchParams?: { ref?: string } }) {
  const ref = searchParams?.ref || "";
  return (
    <main className="container-section section-padding text-center" dir="rtl">
      <div className="mx-auto max-w-xl card p-8">
        <h1 className="text-3xl font-extrabold text-red-600 mb-2">התשלום בוטל</h1>
        <p className="opacity-80">לא בוצע חיוב. אפשר לחזור ולנסות שוב בכל עת.</p>
        <p className="opacity-60 text-sm mt-3">מזהה הזמנה: <code>{ref || "—"}</code></p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <a href="/book" className="btn px-5 py-2 rounded-lg">חזרה להזמנה</a>
          <a href="/" className="btn px-5 py-2 rounded-lg">דף הבית</a>
        </div>
      </div>
    </main>
  );
}
