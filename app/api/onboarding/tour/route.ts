import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTourCompleted, setTourCompleted } from "@/lib/onboarding";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ completed: true });
  }

  try {
    const completed = await getTourCompleted(session.user.id);
    return NextResponse.json({ completed });
  } catch (err) {
    console.error("Tour status fetch error:", err);
    return NextResponse.json({ completed: true });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { completed?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // no body — default to marking completed
  }

  try {
    await setTourCompleted(session.user.id, body.completed !== false);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Tour status update error:", err);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
