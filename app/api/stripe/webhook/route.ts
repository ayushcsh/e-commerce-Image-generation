import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { addUserCredits } from "@/lib/credits";

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

    if (!userId || !credits) {
      console.error("[stripe] webhook missing userId/credits for session", session.id);
      return NextResponse.json({ received: true });
    }

    // Keyed by session ID so retried webhook deliveries can't double-credit.
    await addUserCredits(
      userId,
      credits,
      `Stripe purchase: ${plan} plan`,
      session.id
    );
  }

  return NextResponse.json({ received: true });
}
