"use client";

export default function AdminBookingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // לא עושים console.error כדי לא להדליק overlay
  const msg =
    (error?.message || "")
      .replace(/\s+/g, " ")
      .slice(0, 300) || "שגיאה לא ידועה";

  return (
    <div dir="rtl" className="space-y-4">
      <h1 className="text-2xl font-extrabold">הזמנות</h1>
      <div className="card p-4 space-y-2">
        <div className="text-rose-600 font-semibold">אירעה שגיאה בעמוד ההזמנות</div>
        <div className="text-sm opacity-80 break-words">{msg}</div>
        <div className="flex gap-2">
          <button className="btn px-4" onClick={() => reset()}>רענן עמוד</button>
        </div>
      </div>
    </div>
  );
}
