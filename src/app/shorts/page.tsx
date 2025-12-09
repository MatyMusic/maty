// src/app/shorts/page.tsx
import ShortsFeed from "@/components/shorts/ShortsFeed";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="pb-safe">
      <ShortsFeed />
    </main>
  );
}
