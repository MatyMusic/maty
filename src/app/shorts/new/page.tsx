// src/app/shorts/new/page.tsx
import ShortsComposer from "@/components/shorts/ShortsComposer";
import { brandTitle } from "@/lib/branding";

export const metadata = {
  title: brandTitle("צור Short"),
};

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="container-section section-padding pb-safe">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6">
        צור Short חדש
      </h1>
      <ShortsComposer />
    </main>
  );
}
