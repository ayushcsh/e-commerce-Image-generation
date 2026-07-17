import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { setUserCredits } from "@/lib/credits";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only allow real, deliverable email domains (not disposable/temporary services)
const BLOCKED_DOMAINS = new Set([
  "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
  "10minutemail.com", "fakeinbox.com", "trashmail.com", "yopmail.com",
  "getnada.com", "temp-mail.org", "maildrop.cc",
]);

function isRealEmail(email: string): boolean {
  if (!EMAIL_REGEX.test(email)) return false;
  const domain = email.split("@")[1].toLowerCase();
  if (BLOCKED_DOMAINS.has(domain)) return false;
  // Reject domains with "temp", "throw", "fake", "trash", "disposable" in the name
  if (/temp|throw|fake|trash|dispos|dump|burner|spam/i.test(domain)) return false;
  return true;
}

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (!isRealEmail(email)) {
    return NextResponse.json(
      { error: "Please use a real email address. Temporary or disposable emails are not allowed." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");
    const users = db.collection("users");

    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await users.insertOne({
      email,
      password: hashedPassword,
      name: email.split("@")[0],
      emailVerified: null,
      createdAt: new Date(),
    });

    // Grant $10 test credits on signup
    await setUserCredits(result.insertedId.toString(), 10, "Welcome bonus: $10 test credits");

    return NextResponse.json(
      { id: result.insertedId.toString(), email, message: "Account created. You can now sign in." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
