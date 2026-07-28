import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getUsers, grantCreditsByEmail, deductCredits, disableUser } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const session = await auth();
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!session?.user?.email || !adminEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1");

  const result = await getUsers({ search, page });
  return NextResponse.json(result);
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
  const { action } = body;

  if (action === "grant") {
    const { email, amount, description } = body;
    if (!email || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const result = await grantCreditsByEmail(email, parseInt(amount), description || "Admin grant");
    return NextResponse.json(result);
  }

  if (action === "deduct") {
    const { userId, amount, reason } = body;
    if (!userId || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const result = await deductCredits(userId, parseInt(amount), reason || "Admin deduction");
    return NextResponse.json(result);
  }

  if (action === "disable" || action === "enable") {
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    const result = await disableUser(userId, action === "disable");
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
