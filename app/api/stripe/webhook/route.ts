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
    const creditsUsd = parseFloat(session.metadata?.creditsUsd ?? "0");

    if (!userId || !creditsUsd) {
      console.error("[stripe] webhook missing userId/creditsUsd for session", session.id);
      return NextResponse.json({ received: true });
    }

    // Credit the USD value of credits purchased (not the INR paid — avoids
    // rate fluctuation issues). Keyed by session ID so retries can't double-credit.
    await addUserCredits(
      userId,
      creditsUsd,
      `Stripe purchase: ${plan} plan`,
      session.id
    );
  }

  return NextResponse.json({ received: true });
}
