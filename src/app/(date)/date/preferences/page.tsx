// // src/app/(date)/date/preferences/page.tsx
// import PreferencesForm from "@/components/maty-date/PreferencesForm";
// // import StepNav from "@/components/maty-date/StepNav";

// export const metadata = { title: "MATY-DATE | Preferences" };

// export default function Page() {
//   return (
//     <main
//       dir="rtl"
//       className="min-h-dvh bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
//     >
//       <section className="mx-auto max-w-3xl mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-6 md:p-8 shadow-sm text-right">
//         {/* <StepNav active="preferences" /> */}
//         <h1 className="text-2xl md:text-3xl font-extrabold mb-3">
//           העדפות התאמה
//         </h1>
//         <p className="opacity-70 text-sm mb-6">
//           מלאו את הפרטים שחשובים לכם – זה יעזור לנו למצוא לכם התאמות טובות יותר.
//         </p>
//         <PreferencesForm />
//       </section>
//     </main>
//   );
// }

import PreferencesForm from "@/components/maty-date/PreferencesForm";

export const metadata = { title: "MATY-DATE | Preferences" };

export default function Page() {
  return (
    <main
      dir="rtl"
      className="min-h-dvh bg-gradient-to-br from-violet-50 to-pink-50 dark:from-neutral-950 dark:to-violet-950/20"
    >
      <section className="mx-auto max-w-3xl mt-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-neutral-900/70 p-6 md:p-8 shadow-sm text-right">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-3">
          העדפות התאמה
        </h1>
        <p className="opacity-70 text-sm mb-6">
          זה יעזור לנו למצוא לכם התאמות טובות יותר.
        </p>
        <PreferencesForm />
      </section>
    </main>
  );
}
