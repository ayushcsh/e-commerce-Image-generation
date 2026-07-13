import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

const errorMessages: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  OAuthAccountNotLinked: "Use the same provider you originally signed up with.",
  Default: "Sign in failed. Please try again."
};

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

  const errorMessage = params.error
    ? errorMessages[params.error] || errorMessages.Default
    : "";

  return (
    <main className="loginPage">
      <div className="loginCard">
        <section className="loginHero" aria-hidden="true" />

        <section className="loginPanel">
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
            <h1>Create an account</h1>
            <p>Access your tasks, notes, and projects anytime, anywhere — and keep everything flowing in one place.</p>
          </div>

          {errorMessage ? <p className="loginError">{errorMessage}</p> : null}

          <form
            className="loginForm"
            action={async (formData: FormData) => {
              "use server";
              const email = formData.get("email")?.toString().trim() ?? "";
              const password = formData.get("password")?.toString() ?? "";
              await signIn("credentials", { email, password, redirectTo: callbackUrl });
            }}
          >
            <label className="inputGroup">
              <span>Email</span>
              <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
            </label>

            <label className="inputGroup">
              <span>Password</span>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </label>

            <button className="primaryButton" type="submit">
              Continue with email
            </button>
          </form>

          <div className="divider">
            <span>or continue with</span>
          </div>

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
            Need an account? Sign up with Google or ask your admin to create your login.
          </p>
        </section>
      </div>
    </main>
  );
}
