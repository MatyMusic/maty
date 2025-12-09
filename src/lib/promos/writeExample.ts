// src/lib/promos/writeExample.ts
import { cookies } from "next/headers";

export async function seedExampleHe() {
  const arr = [
    {
      id: "promo_sodil7cl",
      name: "מוזיקה ב־1500 ₪ למגיעים מהאתר",
      status: "active",
      type: "banner",
      priority: "high",
      audience: {
        categories: [],
        moods: [],
        tempos: [],
        bpmMin: null,
        bpmMax: null,
        locales: ["he-IL"],
      },
      schedule: {
        startAt: null,
        endAt: null,
        timezone: "Asia/Jerusalem",
        capping: { maxImpressions: null, dailyCap: null, perUserCap: null },
        pacing: "asap",
      },
      budget: { model: "CPM", bid: null, totalBudget: null },
      creatives: [
        {
          id: "cr_a",
          title: "קריאייטיב A",
          imageUrl: "/assets/banners/1500-he.jpg", // ← קובץ אמיתי ב-public
          body: "דיל מיוחד למבקרים באתר",
          ctaLabel: "שמעו עכשיו",
          ctaUrl: "/booking",
        },
      ],
      stats: { impressions: 0, clicks: 0, ctr: 0, spends: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  cookies().set("md:promos:v1", JSON.stringify(arr), {
    path: "/",
    httpOnly: false,
    sameSite: "Lax",
  });
}
