// import PostComposer from "@/components/flub/PostComposer";
// import Feed from "@/components/flub/Feed";
// import { BRAND } from "@/lib/branding";

// export const dynamic = "force-dynamic";

// export default function Page() {
//   return (
//     <main className="container-section section-padding pb-safe">
//       <header className="mb-6 flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
//             {BRAND.club}
//           </h1>
//           <p className="text-sm text-slate-500 dark:text-slate-400">
//             {BRAND.tagline}
//           </p>
//         </div>
//         <span className="mm-badge mm-badge-brand">CLUB</span>
//       </header>

//       <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
//         <aside className="mm-card p-4 h-max">
//           <h2 className="text-lg font-semibold mb-3">פרסם משהו</h2>
//           <PostComposer />
//         </aside>

//         <section className="space-y-6">
//           <Feed />
//         </section>
//       </div>
//     </main>
//   );
// }

// src/app/flub/page.tsx
import { redirect } from "next/navigation";
export default function FlubRedirect() {
  redirect("/club");
}
