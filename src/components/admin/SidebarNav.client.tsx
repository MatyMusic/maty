// src/components/admin/SidebarNav.client.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

type Item = { href: string; label: string; key?: string }; // key אופציונלי למיפוי באדג׳ים
type GroupKey = "music" | "club" | "date" | "fit" | "jam";

const COLORS: Record<
  GroupKey,
  { chip: string; glow: string; dot: string; title: string }
> = {
  music: {
    chip: "from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30 border-sky-200/60 dark:border-cyan-800/50",
    glow: "shadow-[0_0_0_3px_rgba(56,189,248,0.15)]",
    dot: "bg-sky-500",
    title: "text-sky-700 dark:text-sky-300",
  },
  club: {
    chip: "from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border-fuchsia-200/60 dark:border-fuchsia-800/50",
    glow: "shadow-[0_0_0_3px_rgba(217,70,239,0.15)]",
    dot: "bg-fuchsia-500",
    title: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  date: {
    chip: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/60 dark:border-teal-800/50",
    glow: "shadow-[0_0_0_3px_rgba(16,185,129,0.15)]",
    dot: "bg-emerald-500",
    title: "text-emerald-700 dark:text-emerald-300",
  },
  fit: {
    chip: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/60 dark:border-amber-800/50",
    glow: "shadow-[0_0_0_3px_rgba(245,158,11,0.18)]",
    dot: "bg-amber-500",
    title: "text-amber-700 dark:text-amber-300",
  },
  jam: {
    chip: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200/60 dark:border-violet-800/50",
    glow: "shadow-[0_0_0_3px_rgba(139,92,246,0.18)]",
    dot: "bg-violet-500",
    title: "text-violet-700 dark:text-violet-300",
  },
};

function NavChip({
  href,
  label,
  active,
  group,
  onClick,
  badge,
}: {
  href: string;
  label: string;
  active: boolean;
  group: GroupKey;
  onClick?: () => void;
  badge?: number;
}) {
  const c = COLORS[group];
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm",
        "bg-gradient-to-r transition hover:brightness-105 focus:outline-none focus-visible:ring-2",
        c.chip,
        active ? `ring-1 ${c.glow}` : "ring-0",
      ].join(" ")}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className={`inline-block size-2 rounded-full ${c.dot}`} />
        <span className="truncate">{label}</span>
      </span>
      {!!badge && (
        <span className="ml-2 inline-flex items-center justify-center min-w-5 px-1 h-5 rounded-full text-[11px] font-semibold bg-black/10 dark:bg-white/10">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function SidebarNav({
  music,
  club,
  date,
  fit,
  jam,
  className = "",
}: {
  music: Item[];
  club: Item[];
  date: Item[];
  fit: Item[];
  jam?: Item[]; // ⬅ JAM חדש (אופציונלי)
  className?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // באדג׳ים
  const [badges, setBadges] = React.useState<any>(null);
  React.useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await fetch("/api/admin/badges", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (alive && j?.ok) setBadges(j.badges || null);
      } catch {}
    }
    tick();
    const id = setInterval(tick, 20_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // מיפוי באדג׳ים לפי קישורים/keys
  function getBadgeFor(group: GroupKey, it: Item) {
    if (!badges) return 0;

    if (
      group === "fit" &&
      (it.key === "fit-approvals" || it.href.includes("/admin/fit/groups"))
    ) {
      return badges?.fit?.groupApprovals || 0;
    }

    if (group === "jam") {
      if (
        it.key === "jam-approvals" ||
        it.href.includes("/admin/jam/approvals")
      ) {
        return badges?.jam?.sessionApprovals || 0;
      }
      if (it.href.includes("/admin/jam/reports")) {
        return badges?.jam?.reportsOpen || 0;
      }
    }

    // הרחבות עתידיות: music/club/date...
    return 0;
  }

  const Section = ({
    title,
    items,
    group,
    onItem,
  }: {
    title: string;
    items: Item[];
    group: GroupKey;
    onItem?: () => void;
  }) => {
    const c = COLORS[group];

    // סכום באדג׳ לקבוצה (ל־FIT אישורים; ל־JAM סה"כ אישורים+דיווחים)
    const groupSum =
      group === "fit"
        ? badges?.fit?.groupApprovals || 0
        : group === "jam"
          ? (badges?.jam?.sessionApprovals || 0) +
            (badges?.jam?.reportsOpen || 0)
          : 0;

    return (
      <section className="space-y-2">
        <div
          className={`text-xs font-semibold flex items-center gap-2 ${c.title}`}
        >
          <span>{title}</span>
          {!!groupSum && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] font-semibold bg-black/10 dark:bg-white/10">
              {groupSum}
            </span>
          )}
        </div>
        <nav className="grid gap-1">
          {items.map((it) => {
            const active =
              pathname === it.href ||
              (it.href !== "/" && pathname.startsWith(it.href));
            return (
              <NavChip
                key={it.href}
                href={it.href}
                label={it.label}
                group={group}
                active={!!active}
                onClick={onItem}
                badge={getBadgeFor(group, it)}
              />
            );
          })}
        </nav>
      </section>
    );
  };

  return (
    <>
      {/* מובייל – כפתור */}
      <div className="md:hidden sticky top-0 z-[40] -mx-3 md:mx-0 px-3 py-2 bg-gradient-to-b from-black/10 to-transparent dark:from-white/5">
        <div className="flex items-center justify-between" dir="rtl">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-black/15 dark:border-white/15 bg-white/80 dark:bg-neutral-900/80 backdrop-blur px-3 py-2 text-sm"
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            ☰ תפריט ניהול
          </button>
        </div>
      </div>

      {/* דסקטופ – סיידבר */}
      <aside
        dir="rtl"
        className={[
          "hidden md:block",
          "sticky top-4 self-start",
          "space-y-4 rounded-2xl border p-4",
          "border-black/10 dark:border-white/10",
          "bg-white/70 dark:bg-neutral-900/50 backdrop-blur",
          className,
        ].join(" ")}
        aria-label="תפריט ניהול"
      >
        <Section title="MATY-MUSIC" items={music} group="music" />
        <Section title="MATY-CLUB" items={club} group="club" />
        <Section title="MATY-DATE" items={date} group="date" />
        <Section title="MATY-FIT" items={fit} group="fit" />
        {jam?.length ? (
          <Section title="MATY-JAM" items={jam} group="jam" />
        ) : null}
      </aside>

      {/* מובייל – Drawer */}
      {open && (
        <div
          role="dialog"
          aria-label="תפריט ניהול"
          className="md:hidden fixed inset-0 z-[100]"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div
            dir="rtl"
            className="absolute inset-y-0 right-0 w-[85%] max-w-[360px] bg-white dark:bg-neutral-950 border-s-2 border-black/10 dark:border-white/10 shadow-2xl p-4 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-base font-semibold">תפריט ניהול</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="סגור"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <Section
                title="MATY-MUSIC"
                items={music}
                group="music"
                onItem={() => setOpen(false)}
              />
              <Section
                title="MATY-CLUB"
                items={club}
                group="club"
                onItem={() => setOpen(false)}
              />
              <Section
                title="MATY-DATE"
                items={date}
                group="date"
                onItem={() => setOpen(false)}
              />
              <Section
                title="MATY-FIT"
                items={fit}
                group="fit"
                onItem={() => setOpen(false)}
              />
              {jam?.length ? (
                <Section
                  title="MATY-JAM"
                  items={jam}
                  group="jam"
                  onItem={() => setOpen(false)}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
