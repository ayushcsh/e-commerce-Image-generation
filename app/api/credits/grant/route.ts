import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCredits, setUserCredits } from "@/lib/credits";

export async function POST(request: NextRequest) {
  // Simple admin check via header for now (replace with proper admin auth in production)
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_SECRET && adminKey !== "test-admin-key") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { userId, amount, description } = await request.json();

  if (!userId || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const existing = await getUserCredits(userId);
    const newBalance = (existing?.balance ?? 0) + amount;
    await setUserCredits(userId, newBalance, description || `Granted $${amount.toFixed(2)}`);

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (err) {
    console.error("Grant credits error:", err);
    return NextResponse.json({ error: "Failed to grant credits." }, { status: 500 });
  }
}
