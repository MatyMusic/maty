// דף מלא — src/lib/promos/readFromCookies.ts
import { cookies } from "next/headers";
import { PromoZ, type Promo } from "./types"; // דאג למלא את types.ts או להסיר את הזוד
import { localeMatches } from "@/lib/i18n/locale";

const COOKIE_NAME = "md:promos:v1";

function isCreativeValid(p: Promo) {
  const c = p.creatives?.[0];
  return !!(c && c.imageUrl && c.ctaUrl);
}

export async function getPromosForLocale(locale: string): Promise<Promo[]> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];

  const promos: Promo[] = [];
  for (const item of arr) {
    const parsed = PromoZ.safeParse
      ? PromoZ.safeParse(item)
      : { success: true, data: item };
    if (!parsed.success) continue;
    const p = parsed.data as Promo;
    const locs = (p as any)?.audience?.locales || [];
    const localeOk =
      !locs.length || locs.some((l: string) => localeMatches(l, locale));
    if (p.status === "active" && localeOk && isCreativeValid(p)) {
      promos.push(p);
    }
  }
  return promos.sort((a: any, b: any) => {
    const pr = (x?: string) => (x === "high" ? 2 : x === "normal" ? 1 : 0);
    return pr(b.priority) - pr(a.priority);
  });
}
