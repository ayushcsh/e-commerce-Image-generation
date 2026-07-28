import { handlers, auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getTransactions } from "@/lib/admin";

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
  const type = searchParams.get("type") || "all";
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const page = parseInt(searchParams.get("page") || "1");

  const result = await getTransactions({ type, startDate, endDate, page });
  return NextResponse.json(result);
}

export const { GET: HttpGet } = handlers;
