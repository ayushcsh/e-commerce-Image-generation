import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { consumeWelcomePopupFlag } from "@/lib/credits";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ show: false });
  }

  try {
    const show = await consumeWelcomePopupFlag(session.user.id);
    return NextResponse.json({ show });
  } catch (err) {
    console.error("Welcome popup check error:", err);
    return NextResponse.json({ show: false });
  }
}
