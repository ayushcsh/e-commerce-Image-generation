import { NextResponse } from "next/server";
import { addUserCredits } from "@/lib/credits";
import { sendReceiptEmail } from "@/lib/email";
import { getEffectivePlan, isCreditPlanId } from "@/lib/pricing";
import { getRazorpayOrder, verifyRazorpayWebhookSignature } from "@/lib/razorpay";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        order_id?: string;
        email?: string;
        notes?: Record<string, string>;
      };
    };
  };
};

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  try {
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }
  } catch (err) {
    console.error("[razorpay] webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as RazorpayWebhookPayload;

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    const paymentId = payment?.id;
    const orderId = payment?.order_id;

    if (!paymentId || !orderId || payment?.status !== "captured") {
      return NextResponse.json({ received: true });
    }

    let notes = payment.notes || {};
    if (!notes.userId || !notes.plan || !notes.credits || !notes.priceInr) {
      const order = await getRazorpayOrder(orderId).catch(() => null);
      notes = order?.notes || notes;
    }

    const userId = notes.userId;
    const plan = notes.plan;
    const credits = parseInt(notes.credits || "0", 10);
    const priceInr = parseInt(notes.priceInr || "0", 10);

    if (!userId || !isCreditPlanId(plan) || !credits || !priceInr) {
      console.error("[razorpay] webhook missing payment metadata", paymentId);
      return NextResponse.json({ received: true });
    }

    const planConfig = getEffectivePlan(plan);
    const expectedAmount = Math.round(planConfig.priceInr * 100);
    if (payment.amount !== expectedAmount || payment.currency !== "INR") {
      console.error("[razorpay] webhook amount mismatch", paymentId);
      return NextResponse.json({ received: true });
    }

    const result = await addUserCredits(
      userId,
      credits,
      `Razorpay purchase: ${plan} plan`,
      paymentId,
      { priceInr: priceInr || undefined, planId: plan }
    );

    const email = payment.email || notes.email;
    if (!result.alreadyProcessed && email) {
      await sendReceiptEmail({
        to: email,
        planName: planConfig.name,
        credits,
        bonus: planConfig.bonus,
        priceInr,
        orderId: paymentId.slice(-10).toUpperCase(),
        createdAt: new Date(),
      });
    }
  }

  return NextResponse.json({ received: true });
}
