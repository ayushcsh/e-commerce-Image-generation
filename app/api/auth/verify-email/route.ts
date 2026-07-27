import { NextRequest, NextResponse } from "next/server";
import { verifyEmailCode } from "@/lib/emailVerification";

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const code = (body.code ?? "").trim();

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }

  const result = await verifyEmailCode(email, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ verified: true });
}
