"use client";

type Step = {
  key: string;
  title: string;
  subtitle?: string;
  done?: boolean;
};

export default function WizardStepper({
  steps,
  current,
  onSelect,
  percent,
}: {
  steps: Step[];
  current: number;
  onSelect: (index: number) => void;
  percent?: number;
}) {
  return (
    <div
      dir="rtl"
      className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-neutral-900/70 bg-white/90 dark:bg-neutral-900/90 border-b border-black/10 dark:border-white/10"
    >
      {/* פס התקדמות דק למעלה */}
      <div className="h-1 w-full bg-black/10 dark:bg-white/10">
        <div
          className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500"
          style={{ width: `${Math.min(percent ?? 0, 100)}%` }}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <div className="font-extrabold">השלמת פרופיל · MATY-DATE</div>
          <div className="flex gap-2 flex-wrap">
            {steps.map((s, i) => {
              const on = i === current;
              const done = !!s.done;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onSelect(i)}
                  className={[
                    "group rounded-full px-3 py-1.5 text-sm border transition",
                    on
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                      : "bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-neutral-800",
                  ].join(" ")}
                  title={s.subtitle || s.title}
                >
                  <span className="inline-flex items-center gap-1">
                    {done ? "✔️" : i + 1}
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
