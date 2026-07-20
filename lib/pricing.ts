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
