import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCredits, setUserCredits, getTransactionHistory } from "@/lib/credits";
import { IMAGE_COST } from "@/lib/pricing";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const credits = await getUserCredits(session.user.id);
    const transactions = await getTransactionHistory(session.user.id, 20);

    return NextResponse.json({
      balance: credits?.balance ?? 0,
      pricing: IMAGE_COST,
      transactions: transactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    console.error("Credits fetch error:", err);
    return NextResponse.json({ error: "Failed to load credits." }, { status: 500 });
  }
}
