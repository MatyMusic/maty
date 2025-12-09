// src/components/date/DobField.tsx
"use client";
import { useEffect, useMemo, useState } from "react";

function daysInMonth(y: number, m: number) {
  // m: 1..12
  return new Date(y, m, 0).getDate();
}

function isValidYMD(y: number, m: number, d: number) {
  if (!y || !m || !d) return false;
  if (m < 1 || m > 12) return false;
  const dim = daysInMonth(y, m);
  if (d < 1 || d > dim) return false;
  // בדיקת שלמות מול אובייקט Date
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
}

function calcAge(y: number, m: number, d: number) {
  if (!isValidYMD(y, m, d)) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const mDiff = today.getMonth() + 1 - m;
  const dDiff = today.getDate() - d;
  if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) age--;
  return age;
}

export function DobField({
  value, // "YYYY-MM-DD" | ""
  onChange,
  minYear = 1920,
  maxYear = new Date().getFullYear() - 16, // גיל מינ' 16 ברירת מחדל
  minAge = 16,
  maxAge = 110,
  required = false,
  showStatus = true,
  onValidityChange,
  idPrefix = "dob",
}: {
  value: string;
  onChange: (nextIso: string) => void;
  minYear?: number;
  maxYear?: number;
  minAge?: number;
  maxAge?: number;
  required?: boolean;
  showStatus?: boolean;
  onValidityChange?: (valid: boolean) => void;
  idPrefix?: string;
}) {
  // פיענוח ערך נכנס
  const [y, m, d] = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [yy, mm, dd] = value.split("-").map(Number);
      return [yy, mm, dd];
    }
    return [0, 0, 0];
  }, [value]);

  const year = y || 0;
  const month = m || 0;
  const day = d || 0;

  // אופציות לתיבות בחירה
  const yearOptions = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i),
    [minYear, maxYear],
  );
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i + 1),
    [],
  );
  const dim = useMemo(
    () => (year && month ? daysInMonth(year, month) : 31),
    [year, month],
  );
  const dayOptions = useMemo(
    () => Array.from({ length: dim }, (_, i) => i + 1),
    [dim],
  );

  // לוגיקת ולידציה/סטטוס
  const hasAny = !!(year || month || day);
  const complete = !!(year && month && day);
  const inYearRange = !year || (year >= minYear && year <= maxYear);
  const dateValid = complete && isValidYMD(year, month, day);
  const age = dateValid ? calcAge(year, month, day) : null;
  const ageOk =
    age !== null && age >= (minAge ?? 0) && age <= (maxAge ?? Infinity);
  const valid = complete && dateValid && inYearRange && !!ageOk;

  // דו"ח להורה (אם ביקש)
  useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  function emit(nextY: number, nextM: number, nextD: number) {
    if (!nextY || !nextM || !nextD) {
      onChange("");
      return;
    }
    const dd = String(Math.min(nextD, daysInMonth(nextY, nextM))).padStart(
      2,
      "0",
    );
    const mm = String(nextM).padStart(2, "0");
    const yy = String(nextY);
    onChange(`${yy}-${mm}-${dd}`);
  }

  const statusId = `${idPrefix}-status`;

  // הודעת מצב (אדום → ירוק)
  let statusText = "";
  let statusClass = "text-xs mt-1";
  if (showStatus && hasAny) {
    if (!complete) {
      statusText = "נא לבחור תאריך מלא (שנה · חודש · יום)";
      statusClass += " text-red-600";
    } else if (!inYearRange) {
      statusText = `השנה מחוץ לטווח (${minYear}–${maxYear})`;
      statusClass += " text-red-600";
    } else if (!dateValid) {
      statusText = "תאריך לא תקין (בדקו את היום בחודש)";
      statusClass += " text-red-600";
    } else if (!ageOk) {
      if (age !== null && age < minAge) {
        statusText = `נדרש גיל מינימלי ${minAge}+`;
      } else if (age !== null && age > maxAge) {
        statusText = `גיל מרבי ${maxAge}`;
      } else {
        statusText = "תאריך לא עומד בדרישות הגיל";
      }
      statusClass += " text-red-600";
    } else {
      statusText = `✓ תאריך תקין${age !== null ? ` · גיל ${age}` : ""}`;
      statusClass += " text-emerald-600";
    }
  }

  return (
    <div className="grid gap-1" data-valid={valid ? "1" : "0"}>
      <div className="grid grid-cols-3 gap-2">
        {/* שנה */}
        <select
          className="mm-select"
          value={year || ""}
          onChange={(e) => emit(Number(e.target.value || 0), month, day)}
          required={required}
          aria-invalid={hasAny && !valid ? true : undefined}
          aria-describedby={showStatus ? statusId : undefined}
        >
          <option value="">{required ? "שנה *" : "שנה"}</option>
          {yearOptions.map((yy) => (
            <option key={yy} value={yy}>
              {yy}
            </option>
          ))}
        </select>

        {/* חודש */}
        <select
          className="mm-select"
          value={month || ""}
          onChange={(e) => emit(year, Number(e.target.value || 0), day)}
          required={required}
          aria-invalid={hasAny && !valid ? true : undefined}
          aria-describedby={showStatus ? statusId : undefined}
        >
          <option value="">{required ? "חודש *" : "חודש"}</option>
          {monthOptions.map((mm) => (
            <option key={mm} value={mm}>
              {mm.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        {/* יום */}
        <select
          className="mm-select"
          value={day || ""}
          onChange={(e) => emit(year, month, Number(e.target.value || 0))}
          required={required}
          aria-invalid={hasAny && !valid ? true : undefined}
          aria-describedby={showStatus ? statusId : undefined}
        >
          <option value="">{required ? "יום *" : "יום"}</option>
          {dayOptions.map((dd) => (
            <option key={dd} value={dd}>
              {dd.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>

      {/* שורת סטטוס */}
      {showStatus && hasAny && (
        <div id={statusId} className={statusClass}>
          {statusText}
        </div>
      )}
    </div>
  );
}
