import { NextRequest, NextResponse } from "next/server";
import { resendVerificationCode } from "@/lib/emailVerification";

export async function POST(request: NextRequest) {
  let body: { email?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const result = await resendVerificationCode(email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ sent: true });
}
