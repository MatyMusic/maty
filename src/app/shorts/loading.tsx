// src/app/shorts/loading.tsx
export default function Loading() {
  return (
    <div className="container-section section-padding pb-safe">
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mm-card p-4">
            <div className="h-64 w-full skeleton rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
