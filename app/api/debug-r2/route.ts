import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToR2 } from "@/lib/cloudflare";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const userId = session.user.id;
  const testKey = `${userId}/debug-test/${Date.now()}.txt`;
  const testContent = Buffer.from(`R2 test — ${new Date().toISOString()}`);

  try {
    const url = await uploadToR2(testKey, testContent, "text/plain");
    return NextResponse.json({ ok: true, url, key: testKey });
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
