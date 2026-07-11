import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/studio";
  const session = await auth();

  if (session) {
    redirect(callbackUrl);
  }

  return (
    <main className="loginPage">
      <div className="loginCard">
        <Link className="loginBrand" href="/">
          <span className="brandMark" aria-hidden="true">
            AI
          </span>
          <span>
            <strong>AI Product Image Studio</strong>
            <small>Marketplace visuals from product photos</small>
          </span>
        </Link>

        <div className="loginCopy">
          <h1>Sign in to continue</h1>
          <p>Sign in with Google to upload product photos and build image briefs in the Studio.</p>
        </div>

        {params.error ? (
          <p className="loginError">Sign-in failed. Please try again.</p>
        ) : null}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button className="googleButton" type="submit">
            <svg className="googleIcon" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="loginFooter">
          By continuing you agree to let us store your name, email, and profile photo to run your Studio
          account.
        </p>

        <Link className="loginBack" href="/">
          &larr; Back to home
        </Link>
      </div>
    </main>
  );
}
