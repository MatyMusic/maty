// src/app/api/payments/success/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentByPMID,
  updatePayment,
  markPaymentStatus,
  setUserSubscription,
  appendPaymentMeta,
} from "@/lib/payments/db";
import { paypalCaptureOrder } from "@/lib/payments/providers/paypal";
import { calcSubscriptionUntil } from "@/lib/payments/types";

/** קיטלוגים: מנוי דייטים מול תשלומי אירועים */
type Catalog = "date" | "events";

function paths(cat: Catalog) {
  if (cat === "events") {
    return {
      ok: "/book/thank-you?paid=1",
      canceled: "/book?e=canceled",
      failed: "/book?e=failed",
      thanks: "/book/thank-you?thanks=1",
      notfound: "/book?e=notfound",
      badpmid: "/book?e=badpmid",
      server: "/book?e=server",
    };
  }
  // default/date
  return {
    ok: "/date/matches?upgraded=1",
    canceled: "/date/upgrade?e=canceled",
    failed: "/date/upgrade?e=failed",
    thanks: "/date/matches?thanks=1",
    notfound: "/date/upgrade?e=notfound",
    badpmid: "/date/upgrade?e=badpmid",
    server: "/date/upgrade?e=server",
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const qp = url.searchParams;

  const provider = String(qp.get("provider") || ""); // "paypal" | "cardcom"
  const pmid = String(qp.get("pmid") || "");
  const token = qp.get("token"); // PayPal orderId
  const error = qp.get("error");
  const canceled = qp.get("canceled");
  const lowProfileCode = qp.get("lowprofilecode") || qp.get("LowProfileCode"); // Cardcom לפעמים

  // שמיש לפונקציית redirect יחידה
  const redirect = (p: string) => NextResponse.redirect(new URL(p, req.url));

  try {
    if (!pmid) {
      return redirect(paths("date").badpmid);
    }

    const pm = await getPaymentByPMID(pmid);
    if (!pm) {
      return redirect(paths("date").notfound);
    }

    // קיטלוג עם ברירת מחדל ל־date אם חסר (לאחור)
    const cat: Catalog = (pm as any).catalog === "events" ? "events" : "date";
    const P = paths(cat);

    // נשמור מטא־דאטה של פרמטרי החזרה לצורך דיבוג עתידי
    try {
      const backObj = Object.fromEntries(qp.entries());
      await appendPaymentMeta(pmid, {
        returnQuery: backObj,
        returnReceivedAt: new Date().toISOString(),
      });
    } catch {}

    // בוטל/שגיאה ב־query → מסמנים canceled ומחזירים למסך מתאים
    if (error || canceled) {
      await markPaymentStatus(pmid, "canceled");
      return redirect(P.canceled);
    }

    /** -------------------- PayPal flow -------------------- */
    if (provider === "paypal") {
      if (!token) {
        // חזרה בלי token = כשל
        await markPaymentStatus(pmid, "failed");
        return redirect(P.failed);
      }

      const cap = await paypalCaptureOrder(token);
      if (cap.ok) {
        // עדכון רשומת התשלום
        await updatePayment(pmid, {
          status: "paid",
          providerRef: token,
        });
        await appendPaymentMeta(pmid, { captured: cap.raw });

        // מנויים רלוונטי רק לקטלוג date
        if (cat === "date") {
          const until = calcSubscriptionUntil(
            new Date(),
            pm.plan,
          ).toISOString();
          await setUserSubscription(pm.userId, {
            status: "active",
            tier: pm.plan,
            until,
            provider: "paypal",
            lastPaymentId: pmid,
          });
        }

        return redirect(P.ok);
      } else {
        await markPaymentStatus(pmid, "failed");
        return redirect(P.failed);
      }
    }

    /** -------------------- Cardcom flow --------------------
     * בדרך כלל מאשרים ב־Webhook. כאן רק נשמור providerRef אם הוחזר,
     * ונפנה לעמוד תודה/בדיקת סטטוס.
     */
    if (provider === "cardcom") {
      if (lowProfileCode) {
        await updatePayment(pmid, { providerRef: lowProfileCode });
      }
      // הוובהוק יעדכן ל־paid; פה רק "thank you" / בדיקת סטטוס לקליינט
      return redirect(P.thanks);
    }

    // ספק לא ידוע — ניפול חזרה לעמוד כשל
    return redirect(P.failed);
  } catch (e) {
    try {
      console.error("[payments/success] error:", e);
    } catch {}
    // ברירת מחדל: cat לא ידוע → date
    return NextResponse.redirect(new URL(paths("date").server, req.url));
  }
}
