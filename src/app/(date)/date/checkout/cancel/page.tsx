export default function CancelPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-md p-6 text-right">
      <h1 className="text-2xl font-extrabold">התשלום בוטל</h1>
      <p className="mt-2 opacity-80">
        אפשר לבחור מסלול אחר או לנסות שוב מאוחר יותר.
      </p>
      <div className="mt-4 grid gap-2">
        <a
          href="/date/upgrade"
          className="h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 grid place-items-center"
        >
          חזרה למסלולים
        </a>
        <a
          href="/date/matches"
          className="h-10 rounded-full border grid place-items-center"
        >
          המשך לגלוש
        </a>
      </div>
    </main>
  );
}
