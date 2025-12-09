// src/components/date/PlansGrid.tsx
"use client";
import * as React from "react";
import { getPlanCatalog, type BillingPeriod, priceILS } from "@/lib/date/plans";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Props = {
  // אם יש לך SSR של מסלולים – אפשר להעביר; אם לא, נשלוף מהlib
  initialPeriod?: BillingPeriod;
  onSelectTier?: (tier: string) => void;
};

export default function PlansGrid({
  initialPeriod = "monthly",
  onSelectTier,
}: Props) {
  const [period, setPeriod] = React.useState<BillingPeriod>(initialPeriod);
  const plans = React.useMemo(() => getPlanCatalog(), []);
  const sp = useSearchParams();
  const preselect = sp.get("plan"); // מאפשר /auth?mode=register&plan=maty-match

  return (
    <section dir="rtl" className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">בחרו מסלול הרשמה</h2>
        <PeriodToggle value={period} onChange={setPeriod} />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => (
          <PlanCard
            key={p.slug}
            active={preselect ? preselect === p.slug : p.mostPopular}
            period={period}
            data={p}
            onSelect={() => {
              onSelectTier?.(p.tier);
              // ברירת מחדל: מעבר להרשמה עם פרמטרים
              const url = `/auth?mode=register&from=/date/profile&plan=${encodeURIComponent(
                p.slug
              )}&period=${period}`;
              window.location.href = url;
            }}
          />
        ))}
      </div>

      <p className="text-xs opacity-70 text-right">
        תשלום יתבצע דרך ספק סליקה ישראלי / PayPal (בהמשך). אין חיוב אוטומטי עד
        לאישור מפורש.
      </p>
    </section>
  );
}

function PeriodToggle({
  value,
  onChange,
}: {
  value: "monthly" | "quarterly";
  onChange: (v: "monthly" | "quarterly") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-black/10 dark:border-white/10 overflow-hidden bg-white/80 dark:bg-neutral-900/70">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={[
          "px-4 py-2 text-sm",
          value === "monthly"
            ? "bg-brand text-white"
            : "hover:bg-black/5 dark:hover:bg-white/10",
        ].join(" ")}
      >
        חודשי
      </button>
      <button
        type="button"
        onClick={() => onChange("quarterly")}
        className={[
          "px-4 py-2 text-sm",
          value === "quarterly"
            ? "bg-brand text-white"
            : "hover:bg-black/5 dark:hover:bg-white/10",
        ].join(" ")}
      >
        רבעוני
      </button>
    </div>
  );
}

function PlanCard({
  data,
  period,
  onSelect,
  active,
}: {
  data: ReturnType<typeof getPlanCatalog>[number];
  period: BillingPeriod;
  onSelect: () => void;
  active?: boolean;
}) {
  const price = priceILS(data, period);
  const isFree = price === 0;

  return (
    <div
      className={[
        "relative rounded-3xl p-4 border shadow-sm transition",
        "hover:shadow-lg hover:-translate-y-0.5",
        data.gradient,
        active
          ? "ring-2 ring-amber-500"
          : "ring-1 ring-black/5 dark:ring-white/5",
      ].join(" ")}
    >
      {data.badge && (
        <div className="absolute -top-2 right-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs px-3 py-1 shadow">
          {data.badge}
        </div>
      )}
      <div className="space-y-2">
        <div className="text-[13px] opacity-70">{data.subtitle}</div>
        <h3 className="text-2xl font-extrabold">{data.title}</h3>

        <div className="flex items-baseline gap-1 mt-2">
          <div className="text-4xl font-black tabular-nums">
            {isFree ? "חינם" : `₪${price.toLocaleString("he-IL")}`}
          </div>
          {!isFree && (
            <div className="text-xs opacity-70">
              {period === "monthly" ? "לחודש" : "לרבעון"}
            </div>
          )}
        </div>

        <ul className="mt-3 space-y-1.5 text-sm">
          {data.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <span aria-hidden>✓</span>
              <span className="leading-5">{f}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onSelect}
          className={[
            "w-full mt-4 h-11 rounded-full font-semibold",
            isFree
              ? "border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
              : "bg-brand text-white hover:opacity-90",
          ].join(" ")}
          title={`בחר ${data.title}`}
        >
          {isFree ? "התחל בחינם" : "בחר מסלול"}
        </button>

        {/* קישורי עזר (אופציונלי) */}
        {data.tier === "vip" && (
          <div className="mt-2 text-xs">
            מעוניין בליווי אישי?{" "}
            <Link className="underline decoration-dotted" href="#matchmaker">
              דברו עם שדכנית
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
