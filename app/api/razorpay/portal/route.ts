import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Razorpay does not provide a customer billing portal. Receipts are available in credit history." },
    { status: 404 }
  );
}
