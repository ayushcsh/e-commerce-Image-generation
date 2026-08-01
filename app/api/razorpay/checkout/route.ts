import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addUserCredits } from "@/lib/credits";
import { sendReceiptEmail } from "@/lib/email";
import { getEffectivePlan, isCreditPlanId } from "@/lib/pricing";
import {
  captureRazorpayPayment,
  createRazorpayOrder,
  getRazorpayKeyId,
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay";

async function verifyPayment(input: {
  userId: string;
  userEmail?: string | null;
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  if (!verifyRazorpayPaymentSignature(input)) {
    return NextResponse.json({ error: "Invalid Razorpay payment signature." }, { status: 400 });
  }

  const [order, payment] = await Promise.all([
    getRazorpayOrder(input.orderId),
    getRazorpayPayment(input.paymentId),
  ]);

  if (payment.order_id !== input.orderId) {
    return NextResponse.json({ error: "Payment does not belong to this order." }, { status: 400 });
  }

  const notes = order.notes || {};
  const plan = notes.plan;
  const credits = parseInt(notes.credits || "0", 10);
  const priceInr = parseInt(notes.priceInr || "0", 10);

  if (notes.userId !== input.userId || !isCreditPlanId(plan) || !credits || !priceInr) {
    return NextResponse.json({ error: "Payment metadata is invalid." }, { status: 400 });
  }

  const planConfig = getEffectivePlan(plan);
  const expectedAmount = Math.round(planConfig.priceInr * 100);
  if (order.amount !== expectedAmount || payment.amount !== expectedAmount || payment.currency !== "INR") {
    return NextResponse.json({ error: "Payment amount verification failed." }, { status: 400 });
  }

  let finalPayment = payment;
  if (finalPayment.status === "authorized") {
    finalPayment = await captureRazorpayPayment(finalPayment.id, finalPayment.amount);
  }

  if (finalPayment.status !== "captured") {
    return NextResponse.json({ error: "Payment has not been captured yet." }, { status: 402 });
  }

  const result = await addUserCredits(
    input.userId,
    credits,
    `Razorpay purchase: ${plan} plan`,
    finalPayment.id,
    { priceInr, planId: plan }
  );

  if (!result.alreadyProcessed && input.userEmail) {
    await sendReceiptEmail({
      to: input.userEmail,
      planName: planConfig.name,
      credits,
      bonus: planConfig.bonus,
      priceInr,
      orderId: finalPayment.id.slice(-10).toUpperCase(),
      createdAt: new Date(),
    });
  }

  return NextResponse.json({
    success: true,
    newBalance: result.newBalance,
    alreadyProcessed: result.alreadyProcessed,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body?.action === "verify") {
    if (
      typeof body.orderId !== "string" ||
      typeof body.paymentId !== "string" ||
      typeof body.signature !== "string"
    ) {
      return NextResponse.json({ error: "Missing Razorpay payment verification data." }, { status: 400 });
    }

    try {
      return await verifyPayment({
        userId: session.user.id,
        userEmail: session.user.email,
        orderId: body.orderId,
        paymentId: body.paymentId,
        signature: body.signature,
      });
    } catch (err) {
      console.error("[razorpay] payment verification error:", err);
      return NextResponse.json({ error: "Failed to verify payment." }, { status: 502 });
    }
  }

  const plan = body?.plan;
  if (!isCreditPlanId(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const planConfig = getEffectivePlan(plan);
  const priceInr = planConfig.priceInr;
  const credits = planConfig.credits;

  try {
    const order = await createRazorpayOrder({
      amountInr: priceInr,
      receipt: `vf_${session.user.id.slice(-10)}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        plan,
        credits: String(credits),
        priceInr: String(priceInr),
        email: session.user.email ?? "",
      },
    });

    return NextResponse.json({
      keyId: getRazorpayKeyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name: "VendorFlow",
      description: `${planConfig.name} Plan - ${credits} Credits`,
      prefill: {
        name: session.user.name ?? "",
        email: session.user.email ?? "",
      },
    });
  } catch (err) {
    console.error("[razorpay] order creation error:", err);
    return NextResponse.json({ error: "Failed to start Razorpay checkout." }, { status: 502 });
  }
}
