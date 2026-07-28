import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAdminStats } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const session = await auth();
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!session?.user?.email || !adminEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
