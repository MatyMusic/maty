import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentByPMID,
  updatePayment,
  setUserSubscription,
} from "@/lib/payments/db";
import { PLANS, addMonths } from "@/lib/payments/types";

// Cardcom שולחים POST עם פרטים (לפי ReturnValue/LowProfileCode וכו')
// כאן אנחנו מניחים שפרמטר pmid הגיע בשורת כתובת (הכנסנו ב-NotifyURL).
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pmid = searchParams.get("pmid") || "";

    const bodyTxt = await req.text(); // Cardcom לעתים שולחים כ-form-urlencoded/טקסט
    // אפשר לפענח:
    const data = Object.fromEntries(new URLSearchParams(bodyTxt));

    // דוגמה לפרמטרים אופייניים: ResponseCode=0 (הצלחה), ReturnValue=pmid
    const responseCode = String(data.ResponseCode || "");
    const approved = responseCode === "0";

    const pm = await getPaymentByPMID(pmid);
    if (!pm)
      return NextResponse.json(
        { ok: false, error: "payment_not_found" },
        { status: 404 }
      );

    if (approved) {
      await updatePayment(pmid, {
        status: "paid",
        providerRef: data.LowProfileCode || pm.providerRef,
        meta: { ...pm.meta, cardcom: data },
      });
      // עדכון המנוי
      const plan = PLANS[pm.plan];
      const until = addMonths(new Date(), plan.months).toISOString();
      await setUserSubscription(pm.userId, {
        status: "active",
        tier: pm.plan,
        until,
        provider: "cardcom",
        lastPaymentId: pmid,
      });
    } else {
      await updatePayment(pmid, {
        status: "failed",
        providerRef: data.LowProfileCode || pm.providerRef,
        meta: { ...pm.meta, cardcom: data },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "server_error" },
      { status: 500 }
    );
  }
}
