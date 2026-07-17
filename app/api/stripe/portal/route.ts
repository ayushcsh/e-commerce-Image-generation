import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const stripe = getStripe();

  try {
    const customers = await stripe.customers.list({ email: session.user.email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.json({ error: "No billing history found for this account." }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/credits`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[stripe] billing portal error:", err);
    return NextResponse.json({ error: "Failed to open billing portal." }, { status: 502 });
  }
}
