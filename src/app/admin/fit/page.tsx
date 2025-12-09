"use client";

import * as React from "react";
import Link from "next/link";

export default function FitDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-amber-600">
        📊 לוח בקרה — MATY-FIT
      </h1>
      <p className="text-muted-foreground">
        כאן רואים את הסטטיסטיקות העיקריות של קבוצות הספורט, תרגילים ואימונים.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/fit/groups"
          className="p-6 rounded-xl border hover:bg-amber-50 dark:hover:bg-amber-950"
        >
          <h2 className="font-semibold">קבוצות ספורט</h2>
          <p className="text-sm text-muted-foreground">
            ניהול אישורי קבוצות וחברים
          </p>
        </Link>

        <Link
          href="/admin/fit/exercises"
          className="p-6 rounded-xl border hover:bg-amber-50 dark:hover:bg-amber-950"
        >
          <h2 className="font-semibold">תרגילים</h2>
          <p className="text-sm text-muted-foreground">ניהול ספריית תרגילים</p>
        </Link>

        <Link
          href="/admin/fit/workouts"
          className="p-6 rounded-xl border hover:bg-amber-50 dark:hover:bg-amber-950"
        >
          <h2 className="font-semibold">אימונים</h2>
          <p className="text-sm text-muted-foreground">בונה אימונים ודוחות</p>
        </Link>

        <Link
          href="/admin/fit/reports"
          className="p-6 rounded-xl border hover:bg-amber-50 dark:hover:bg-amber-950"
        >
          <h2 className="font-semibold">דיווחים</h2>
          <p className="text-sm text-muted-foreground">
            תוכן פוגעני או בעיות משתמשים
          </p>
        </Link>

        <Link
          href="/admin/fit/settings"
          className="p-6 rounded-xl border hover:bg-amber-50 dark:hover:bg-amber-950"
        >
          <h2 className="font-semibold">הגדרות</h2>
          <p className="text-sm text-muted-foreground">ניהול מדיניות FIT</p>
        </Link>
      </div>
    </div>
  );
}
