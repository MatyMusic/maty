// src/app/shorts/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-section section-padding pb-safe">
      <div className="mm-card p-6">
        <h1 className="text-xl font-bold mb-2">שגיאה בטעינת Shorts</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {error?.message || "תקלה לא צפויה."}
        </p>
        <button onClick={reset} className="mm-btn mm-btn-primary mt-4">
          נסה שוב
        </button>
      </div>
    </div>
  );
}
