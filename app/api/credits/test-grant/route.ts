import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { setUserCredits } from "@/lib/credits";

// Grants 10 free test credits to the currently logged-in user
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await setUserCredits(userId, 10, "Test credits: 10 free credits for testing");
    return NextResponse.json({ success: true, balance: 10 });
  } catch (err) {
    console.error("Test grant error:", err);
    return NextResponse.json({ error: "Failed to grant credits." }, { status: 500 });
  }
}
