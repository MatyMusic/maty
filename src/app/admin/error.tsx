"use client";

export default function AdminError({
  error,
  reset,
}: { error: Error & { digest?: string }, reset: () => void }) {
  console.error(error);
  return (
    <div dir="rtl" style={{padding:16}}>
      <h2 style={{fontWeight:800, marginBottom:8}}>אירעה שגיאה באזור הניהול</h2>
      <pre style={{whiteSpace:"pre-wrap", background:"#0001", padding:12, borderRadius:8}}>
        {String(error?.message || error)}
      </pre>
      <button onClick={() => reset()} style={{marginTop:12}}>רענן</button>
    </div>
  );
}
