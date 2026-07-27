import crypto from "crypto";
import clientPromise from "@/lib/mongodb";
import { sendVerificationEmail } from "@/lib/email";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function getUsers() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB_NAME || "image-generation");
  return db.collection("users");
}

/**
 * Generates a fresh 6-digit code, stores its hash + expiry on the user doc,
 * and emails it. Used by both registration and the resend endpoint.
 */
export async function issueVerificationCode(email: string): Promise<void> {
  const code = crypto.randomInt(100000, 1000000).toString();
  const users = await getUsers();

  await users.updateOne(
    { email },
    {
      $set: {
        emailVerificationCodeHash: hashCode(code),
        emailVerificationExpires: new Date(Date.now() + CODE_TTL_MS),
        emailVerificationAttempts: 0,
        emailVerificationLastSentAt: new Date(),
      },
    }
  );

  await sendVerificationEmail(email, code);
}

export type ResendResult = { ok: true } | { ok: false; error: string; status: number };

/** Re-issues a code, subject to a cooldown so the endpoint can't be used to spam an inbox. */
export async function resendVerificationCode(email: string): Promise<ResendResult> {
  const users = await getUsers();
  const user = await users.findOne({ email });

  // Don't leak account existence — pretend success either way.
  if (!user) return { ok: true };
  if (user.emailVerified) return { ok: false, error: "This email is already verified.", status: 400 };

  const lastSent = user.emailVerificationLastSentAt ? new Date(user.emailVerificationLastSentAt).getTime() : 0;
  if (Date.now() - lastSent < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "Please wait a moment before requesting another code.", status: 429 };
  }

  await issueVerificationCode(email);
  return { ok: true };
}

export type VerifyResult = { ok: true } | { ok: false; error: string; status: number };

/** Checks a submitted code against the stored hash, with expiry + attempt-limit guards. */
export async function verifyEmailCode(email: string, code: string): Promise<VerifyResult> {
  const users = await getUsers();
  const user = await users.findOne({ email });

  if (!user) return { ok: false, error: "Invalid code.", status: 400 };
  if (user.emailVerified) return { ok: true };

  if (!user.emailVerificationCodeHash || !user.emailVerificationExpires) {
    return { ok: false, error: "No active code. Request a new one.", status: 400 };
  }
  if (new Date(user.emailVerificationExpires).getTime() < Date.now()) {
    return { ok: false, error: "This code has expired. Request a new one.", status: 400 };
  }
  if ((user.emailVerificationAttempts ?? 0) >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Request a new code.", status: 429 };
  }

  if (hashCode(code) !== user.emailVerificationCodeHash) {
    await users.updateOne({ email }, { $inc: { emailVerificationAttempts: 1 } });
    return { ok: false, error: "Incorrect code.", status: 400 };
  }

  await users.updateOne(
    { email },
    {
      $set: { emailVerified: new Date() },
      $unset: {
        emailVerificationCodeHash: "",
        emailVerificationExpires: "",
        emailVerificationAttempts: "",
        emailVerificationLastSentAt: "",
      },
    }
  );

  return { ok: true };
}
