// Single source of truth for the credit system — image costs and purchasable
// credit packs. Credits are an integer unit (1 basic image = 1 credit); do
// not treat balances as currency.

export const IMAGE_COST = {
  basic: 1,   // 1 credit per basic image (nano-banana)
  aplus: 5,   // 5 credits per A+ listing image (GPT Image 2)
} as const;

export type CreditPlanId = "starter" | "growth" | "pro" | "business";

export const CREDIT_PLANS: Record<CreditPlanId, { name: string; priceInr: number; credits: number; bonus: number }> = {
  starter:  { name: "Starter",  priceInr: 400,  credits: 20,  bonus: 0 },
  growth:   { name: "Growth",   priceInr: 1000, credits: 55,  bonus: 5 },
  pro:      { name: "Pro",      priceInr: 2000, credits: 115, bonus: 15 },
  business: { name: "Business", priceInr: 5000, credits: 300, bonus: 50 },
};

export function isCreditPlanId(value: unknown): value is CreditPlanId {
  return value === "starter" || value === "growth" || value === "pro" || value === "business";
}

// GST for digital/SaaS services in India (standard rate). Listed plan prices
// are GST-inclusive — nothing extra is charged — this only splits the amount
// already collected into its base + tax components for the invoice/receipt.
export const GST_RATE = 0.18;

export function splitGstInclusive(totalInr: number): { base: number; gst: number } {
  const base = totalInr / (1 + GST_RATE);
  const gst = totalInr - base;
  return { base: Math.round(base * 100) / 100, gst: Math.round(gst * 100) / 100 };
}
