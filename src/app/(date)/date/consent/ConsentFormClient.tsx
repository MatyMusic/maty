// src/app/(date)/date/consent/ConsentFormClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function nowISO() {
  return new Date().toISOString();
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: React.ReactNode;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4"
      />
      <span>{label}</span>
    </label>
  );
}

export default function ConsentFormClient() {
  const [tos, setTos] = React.useState(false);
  const [privacy, setPrivacy] = React.useState(false);
  const [age, setAge] = React.useState(false);
  const [community, setCommunity] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tos || !privacy || !age || !community)
      return alert("נא לאשר את כל הסעיפים");

    setLoading(true);
    try {
      const body = {
        dateEnabled: true,
        datePublic: "dating-only",
        consents: {
          tosAt: nowISO(),
          privacyAt: nowISO(),
          ageAt: nowISO(),
          communityAt: nowISO(),
        },
      };
      const res = await fetch("/api/date/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("שמירה נכשלה");
      router.push("/date/profile");
    } catch (err: any) {
      alert(err?.message || "שמירה נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <Checkbox
        checked={tos}
        onChange={setTos}
        label={
          <>
            קראתי ואני מסכים/ה ל
            <Link href="/terms" className="underline px-1">
              תנאי השימוש
            </Link>
            .
          </>
        }
      />
      <Checkbox
        checked={privacy}
        onChange={setPrivacy}
        label={
          <>
            קראתי ואני מסכים/ה ל
            <Link href="/privacy" className="underline px-1">
              מדיניות הפרטיות
            </Link>
            .
          </>
        }
      />
      <Checkbox
        checked={age}
        onChange={setAge}
        label={<>אני מאשר/ת כי אני בן/בת 18 ומעלה.</>}
      />
      <Checkbox
        checked={community}
        onChange={setCommunity}
        label={
          <>אני מתחייב/ת לכללי הקהילה (שיח מכבד, ללא הטרדות, ללא זיופים).</>
        }
      />

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={loading || !(tos && privacy && age && community)}
          className="inline-flex items-center justify-center h-10 px-6 rounded-full text-sm font-semibold bg-pink-600 text-white disabled:opacity-60"
        >
          {loading ? "שומר…" : "אני מסכימ/ה ומצטרפ/ת"}
        </button>
        <Link
          href="/date"
          className="inline-flex items-center justify-center h-10 px-5 rounded-full text-sm border bg-white/80 dark:bg-neutral-900/80 border-black/10 dark:border-white/10"
        >
          חזרה
        </Link>
      </div>
    </form>
  );
}
