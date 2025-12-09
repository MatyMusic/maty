import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentByPMID,
  updatePayment,
  setUserSubscription,
} from "@/lib/payments/db";
import { PLANS, addMonths } from "@/lib/payments/types";

// לשימוש עם PAYPAL_WEBHOOK_ID אם תרצה לאמת חתימה – ניתן להרחיב.
// בפועל PayPal שולחים event שבו יש resource.purchase_units[0].reference_id = pmid

export async function POST(req: NextRequest) {
  try {
    const event = await req.json().catch(() => ({}));
    const resource = event?.resource || {};
    const unit = resource?.purchase_units?.[0] || {};
    const pmid = unit?.reference_id || "";

    if (!pmid)
      return NextResponse.json(
        { ok: false, error: "no_pmid" },
        { status: 400 }
      );

    const pm = await getPaymentByPMID(pmid);
    if (!pm)
      return NextResponse.json(
        { ok: false, error: "payment_not_found" },
        { status: 404 }
      );

    // נניח שזה אירוע של CAPTURE.COMPLETED
    const status = resource?.status || event?.event_type || "";
    const approved =
      /COMPLETED/i.test(status) ||
      /PAYMENT\.CAPTURE\.COMPLETED/i.test(event?.event_type || "");

    if (approved) {
      await updatePayment(pmid, {
        status: "paid",
        providerRef: resource?.id || pm.providerRef,
        meta: { ...pm.meta, paypal: event },
      });
      const plan = PLANS[pm.plan];
      const until = addMonths(new Date(), plan.months).toISOString();
      await setUserSubscription(pm.userId, {
        status: "active",
        tier: pm.plan,
        until,
        provider: "paypal",
        lastPaymentId: pmid,
      });
    } else {
      await updatePayment(pmid, {
        status: "failed",
        providerRef: resource?.id || pm.providerRef,
        meta: { ...pm.meta, paypal: event },
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
