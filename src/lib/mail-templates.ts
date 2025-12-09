export function renderBookingEmailHTML(opts: {
  site?: string; // לדוגמה: "maty-music.com"
  bookingUrl?: string; // לינק לצפייה/הורדת PDF
  name?: string;
  eventDate?: string; // dd.mm.yyyy או טקסט
  amount?: string; // "3,400 ₪"
}) {
  const site = opts.site ?? "maty-music.com";
  const brand = "#7c3aed";
  const bookingUrl = opts.bookingUrl ?? `https://${site}`;
  const safe = (s?: string) => s || "—";

  return `
  <div style="background:#0b0b0b0f;padding:24px 12px">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
      <div style="background:#f3eaff;padding:24px 24px 12px">
        <h1 dir="rtl" style="margin:0;color:${brand};font:700 22px 'Segoe UI',Roboto,Arial,sans-serif">
          אישור הזמנה — MATY MUSIC
        </h1>
        <div dir="rtl" style="opacity:.7;margin-top:6px;font:400 13px/1.4 'Segoe UI',Roboto,Arial,sans-serif">
          תודה שבחרת בנו! ריכזנו לך פה את פרטי ההזמנה.
        </div>
      </div>

      <div dir="rtl" style="padding:20px 24px">
        <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0 10px;font:400 14px 'Segoe UI',Roboto,Arial,sans-serif;color:#111">
          <tr><td style="opacity:.7">שם הלקוח</td><td style="text-align:left">${safe(
            opts.name
          )}</td></tr>
          <tr><td style="opacity:.7">תאריך האירוע</td><td style="text-align:left">${safe(
            opts.eventDate
          )}</td></tr>
          <tr><td style="opacity:.7">סכום</td><td style="text-align:left">${safe(
            opts.amount
          )}</td></tr>
        </table>

        <div style="text-align:center;margin:22px 0 6px">
          <a href="${bookingUrl}"
            style="display:inline-block;background:${brand};color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font:600 14px 'Segoe UI',Roboto,Arial,sans-serif">
            צפייה בהזמנה / הורדת PDF
          </a>
        </div>

        <div dir="rtl" style="margin-top:14px;font:400 12px/1.6 'Segoe UI',Roboto,Arial,sans-serif;color:#444">
          שאלות? אפשר להשיב למייל הזה או ליצור קשר בוואטסאפ. נשמח לעזור ❤️
        </div>
      </div>

      <div style="padding:14px 24px;border-top:1px solid #eee;text-align:center">
        <a href="https://${site}" style="color:${brand};text-decoration:none;font:600 12px 'Segoe UI',Roboto,Arial,sans-serif">${site}</a>
      </div>
    </div>
  </div>`;
}
