

// src/app/(date)/date/matches/page.tsx
import MatchesClient from "./matches-client";

export default function MatchesRoutePage() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 text-neutral-900 dark:text-white"
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        <MatchesClient />
      </div>
    </main>
  );
}
