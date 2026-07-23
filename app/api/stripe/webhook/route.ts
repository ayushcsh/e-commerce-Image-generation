import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { addUserCredits } from "@/lib/credits";
import { sendReceiptEmail } from "@/lib/email";
import { CREDIT_PLANS, isCreditPlanId } from "@/lib/pricing";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe] webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan ?? "credits";
    const credits = parseInt(session.metadata?.credits ?? "0", 10);
    const priceInr = parseInt(session.metadata?.priceInr ?? "0", 10);

    if (!userId || !credits) {
      console.error("[stripe] webhook missing userId/credits for session", session.id);
      return NextResponse.json({ received: true });
    }

    // Keyed by session ID so retried webhook deliveries can't double-credit.
    const result = await addUserCredits(
      userId,
      credits,
      `Stripe purchase: ${plan} plan`,
      session.id,
      { priceInr: priceInr || undefined, planId: plan }
    );

    const email = session.customer_details?.email ?? session.customer_email;
    if (!result.alreadyProcessed && email) {
      const planConfig = isCreditPlanId(plan) ? CREDIT_PLANS[plan] : undefined;
      await sendReceiptEmail({
        to: email,
        planName: planConfig?.name ?? plan,
        credits,
        bonus: planConfig?.bonus ?? 0,
        priceInr,
        orderId: session.id.slice(-10).toUpperCase(),
        createdAt: new Date(),
      });
    }
  }

  return NextResponse.json({ received: true });
}
