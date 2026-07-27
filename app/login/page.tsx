"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";

type Mode = "signin" | "register" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string>("");
  const [globalError, setGlobalError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const callbackUrl = "/studio";

  // Carried from register (or a blocked sign-in) into the OTP step so we can
  // silently sign the user in the moment their code checks out.
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  // Deep-link straight into signup mode when arriving via a "Create Account" link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") setMode("register");
  }, []);

  // This is a full-screen page (.loginPage already clips to 100vh) — lock the
  // body too, so a sub-pixel viewport rounding can't leave a stray page scrollbar.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  async function handleCredentials(formData: FormData) {
    setError("");
    const email = formData.get("email")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    if (mode === "register") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      startTransition(async () => {
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? "Registration failed.");
            return;
          }
          // Register route already sent the first code — go straight to entry.
          setPendingEmail(email);
          setPendingPassword(password);
          setOtp("");
          setMode("verify");
        } catch {
          setError("Registration failed. Please try again.");
        }
      });
    } else {
      startTransition(async () => {
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.error) {
          if (result.code === "email_not_verified") {
            setPendingEmail(email);
            setPendingPassword(password);
            setOtp("");
            setMode("verify");
            setResendState("sending");
            fetch("/api/auth/resend-code", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            }).finally(() => setResendState("sent"));
            return;
          }
          setError("Invalid email or password.");
          return;
        }
        router.push(callbackUrl);
      });
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      const result = await signIn("credentials", {
        email: pendingEmail,
        password: pendingPassword,
        redirect: false,
      });
      if (result?.error) {
        setError("Verified! Please sign in.");
        setMode("signin");
        setPendingPassword("");
        return;
      }
      router.push(callbackUrl);
    });
  }

  function handleResend() {
    setError("");
    setResendState("sending");
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/resend-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingEmail }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not resend code.");
          setResendState("idle");
          return;
        }
        setResendState("sent");
      } catch {
        setError("Could not resend code.");
        setResendState("idle");
      }
    });
  }

  function handleGoogle() {
    startTransition(async () => {
      await signIn("google", { redirectTo: callbackUrl });
    });
  }

  return (
    <main className="loginPage">
      <Link className="loginHomeBtn" href="/" aria-label="Back to home">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
        </svg>
      </Link>

      <div className="loginCard">
        <section className="loginHero" aria-hidden="true" />

        <section className="loginPanel">
          {mode === "verify" ? (
            <>
              <div className="loginCopy">
                <h1>Verify your email</h1>
                <p>We sent a 6-digit code to <strong>{pendingEmail}</strong>. Enter it below to continue.</p>
              </div>

              {globalError ? <p className="loginError">{globalError}</p> : null}

              <form className="loginForm" onSubmit={handleVerify}>
                <label className="inputGroup">
                  <span>Verification code</span>
                  <input
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={isPending}
                  />
                </label>

                {error ? <p className="loginError">{error}</p> : null}

                <button className="primaryButton" type="submit" disabled={isPending}>
                  {isPending ? "Please wait..." : "Verify & Continue"}
                </button>
              </form>

              <p className="loginFooter">
                Didn&apos;t get it?{" "}
                <button
                  type="button"
                  className="linkButton"
                  onClick={handleResend}
                  disabled={isPending || resendState === "sending"}
                >
                  {resendState === "sending" ? "Sending..." : resendState === "sent" ? "Code resent" : "Resend code"}
                </button>
              </p>
              <p className="loginFooter">
                <button
                  type="button"
                  className="linkButton"
                  onClick={() => { setMode("signin"); setError(""); setPendingPassword(""); }}
                >
                  Back to sign in
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="loginCopy">
                <h1>{mode === "signin" ? "Sign in to your account" : "Create your account"}</h1>
                <p>{mode === "signin"
                  ? "Welcome back. Enter your credentials to continue."
                  : "Sign up to start creating marketplace-ready product images."}
                </p>
              </div>

              {globalError ? <p className="loginError">{globalError}</p> : null}

              {/* Mode toggle */}
              <div className="modeToggle">
                <button
                  type="button"
                  className={`toggleBtn${mode === "signin" ? " isActive" : ""}`}
                  onClick={() => { setMode("signin"); setError(""); }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`toggleBtn${mode === "register" ? " isActive" : ""}`}
                  onClick={() => { setMode("register"); setError(""); }}
                >
                  Create Account
                </button>
              </div>

              <form className="loginForm" onSubmit={(e) => { e.preventDefault(); handleCredentials(new FormData(e.currentTarget)); }}>
                <label className="inputGroup">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    disabled={isPending}
                  />
                </label>

                <label className="inputGroup">
                  <span>Password</span>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"}
                    disabled={isPending}
                  />
                </label>

                {error ? <p className="loginError">{error}</p> : null}

                <button className="primaryButton" type="submit" disabled={isPending}>
                  {isPending ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <div className="divider">
                <span>or continue with</span>
              </div>

              <button
                className="googleButton"
                type="button"
                onClick={handleGoogle}
                disabled={isPending}
              >
                <svg className="googleIcon" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
                </svg>
                Continue with Google
              </button>

              <p className="loginFooter">
                {mode === "signin"
                  ? "No account yet? Switch to Create Account above."
                  : "Already have an account? Switch to Sign In above."}
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

