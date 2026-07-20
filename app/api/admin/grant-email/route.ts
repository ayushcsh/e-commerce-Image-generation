import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { setUserCredits } from "@/lib/credits";

// Admin-only endpoint to grant credits to a user by their email
// Call: POST /api/admin/grant-email with body: { email: "...", amount: 10, description: "..." }
// Header: x-admin-key: <ADMIN_SECRET from env>
export async function POST(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_SECRET || "kriscel-admin-secret-2024";

  if (adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  let body: { email?: string; amount?: number; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { email, amount, description } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");

    const user = await db.collection("users").findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
    }

    const userId = user._id.toString();
    const existing = await setUserCredits(userId, amount, description || `Admin grant: ${amount} credits`);

    return NextResponse.json({
      success: true,
      userId,
      email,
      amount,
      newBalance: amount,
    });
  } catch (err) {
    console.error("Admin grant error:", err);
    return NextResponse.json({ error: "Failed to grant credits." }, { status: 500 });
  }
}
