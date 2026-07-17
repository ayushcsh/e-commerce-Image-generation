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

export type CreditPlanId = "basic" | "growth" | "enterprise";

/** Convert INR to USD for internal credit storage (rate: 96 INR = 1 USD). */
export function inrToUsd(inr: number): number {
  return Math.round((inr / 96) * 100) / 100;
}

export const CREDIT_PLANS: Record<CreditPlanId, { name: string; priceInr: number; creditsUsd: number }> = {
  basic: { name: "Basic", priceInr: 699, creditsUsd: 7 },
  growth: { name: "Growth", priceInr: 1299, creditsUsd: 13 },
  enterprise: { name: "Enterprise", priceInr: 4999, creditsUsd: 55 },
};

export function isCreditPlanId(value: unknown): value is CreditPlanId {
  return value === "basic" || value === "growth" || value === "enterprise";
}

