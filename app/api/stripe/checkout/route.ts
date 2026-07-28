import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";
import { isCreditPlanId, getEffectivePlan } from "@/lib/pricing";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const plan = body?.plan;

  if (!isCreditPlanId(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const planConfig = getEffectivePlan(plan);
  const priceInr = planConfig.priceInr;
  const credits = planConfig.credits;
  const origin = request.headers.get("origin") || new URL(request.url).origin;

  try {
    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            unit_amount: priceInr * 100, // Stripe uses paisa
            product_data: {
              name: `${planConfig.name} Plan — ${credits} Credits`,
              description: `Purchase ${credits} credits for AI product image generation`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/credits?success=true`,
      cancel_url: `${origin}/credits?canceled=true`,
      customer_email: session.user.email ?? undefined,
      metadata: {
        userId: session.user.id,
        plan,
        credits: String(credits),
        priceInr: String(priceInr),
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "Could not create checkout session." }, { status: 502 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[stripe] checkout session error:", err);
    return NextResponse.json({ error: "Failed to start checkout." }, { status: 502 });
  }
}
