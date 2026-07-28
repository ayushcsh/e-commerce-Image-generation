import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { isCreditPlanId, getPlanOverrides, setPlanOverride } from "@/lib/pricing";

export async function GET() {
  const session = await auth();
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!session?.user?.email || !adminEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ plans: getPlanOverrides() });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!session?.user?.email || !adminEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { plans } = body;

  if (!plans || typeof plans !== "object") {
    return NextResponse.json({ error: "Invalid plans data" }, { status: 400 });
  }

  for (const [id, data] of Object.entries(plans)) {
    if (!isCreditPlanId(id)) continue;
    const d = data as { priceInr?: number; credits?: number };
    setPlanOverride(id, {
      priceInr: d.priceInr ?? 0,
      credits: d.credits ?? 0,
    });
  }

  return NextResponse.json({ success: true });
}
