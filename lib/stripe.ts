import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/** Lazily-constructed server-side Stripe client. */
export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

export { CREDIT_PLANS, isCreditPlanId, type CreditPlanId } from "@/lib/pricing";

