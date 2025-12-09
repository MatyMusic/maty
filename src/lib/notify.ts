// src/lib/notify.ts
import twilio from "twilio";

const SID = process.env.TWILIO_ACCOUNT_SID || "";
const TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const WA_FROM = process.env.TWILIO_WHATSAPP_FROM || "";
const CC = process.env.PHONE_DEFAULT_COUNTRY_CODE || "+972";

const hasTwilio = !!(SID && TOKEN);
const client = hasTwilio ? twilio(SID, TOKEN) : null;

function toE164(raw?: string) {
  if (!raw) return "";
  const s = raw.trim();
  if (s.startsWith("+")) return s.replace(/[^\d+]/g, "");
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.startsWith("0") ? CC + digits.slice(1) : "+" + digits;
}

// --- וואטסאפ בלבד ---
export async function sendWhatsApp(toRaw: string, body: string) {
  const to = "whatsapp:" + toE164(toRaw);
  const from = WA_FROM.startsWith("whatsapp:")
    ? WA_FROM
    : `whatsapp:${WA_FROM}`;
  if (!hasTwilio || !WA_FROM) {
    console.log("[notify][wa][demo]", { to, body });
    return { ok: false, demo: true };
  }
  try {
    const msg = await client!.messages.create({ from, to, body });
    return { ok: true, sid: msg.sid };
  } catch (e: any) {
    console.warn("[notify][wa] ERROR", e?.code ?? "", e?.message ?? e);
    return { ok: false, error: e?.code || e?.message || String(e) };
  }
}

// שמירת טקסט יפה להזמנה
export function buildBookingTextMessage(p: {
  name?: string;
  dateISO?: string;
  amountILS?: number;
  bookingId?: string;
  siteUrl?: string;
}) {
  const fmt = new Intl.NumberFormat("he-IL");
  const date = p.dateISO
    ? new Date(p.dateISO).toLocaleDateString("he-IL")
    : "—";
  const amount =
    typeof p.amountILS === "number" ? `₪${fmt.format(p.amountILS)}` : "—";
  const link = p.siteUrl
    ? `${p.siteUrl}/orders/${encodeURIComponent(p.bookingId || "")}`
    : "";
  return `שלום ${p.name || ""}! ✅ נקלטה הזמנה אצל MATY MUSIC.
תאריך האירוע: ${date}
סכום משוער: ${amount}
מס׳ הזמנה: ${p.bookingId || "—"}
${link ? "לצפייה בפרטים: " + link : ""}

תודה שבחרת בנו!`.trim();
}

// קישור Click-to-Chat (אם תרצה כפתור באתר)
export function buildWaDeepLink(toRaw: string, text: string) {
  const e164 = toE164(toRaw).replace(/^\+/, "");
  return `https://wa.me/${e164}?text=${encodeURIComponent(text)}`;
}



