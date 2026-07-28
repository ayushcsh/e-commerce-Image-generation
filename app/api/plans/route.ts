import { NextResponse } from "next/server";
import { CREDIT_PLANS, getEffectivePlan, type CreditPlanId } from "@/lib/pricing";

// Public — lets pricing UI reflect admin-set overrides without exposing
// anything sensitive (same data CREDIT_PLANS already ships to the client).
export async function GET() {
  const plans = Object.fromEntries(
    (Object.keys(CREDIT_PLANS) as CreditPlanId[]).map((id) => [id, getEffectivePlan(id)])
  );
  return NextResponse.json({ plans });
}
