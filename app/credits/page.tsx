"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { CREDIT_PLANS, isCreditPlanId, type CreditPlanId } from "@/lib/pricing";

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  priceInr?: number;
  planId?: string;
  orderId?: string;
};

const PLAN_BADGES: Partial<Record<CreditPlanId, string>> = {
  growth: "Popular",
};

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>("script[src='https://checkout.razorpay.com/v1/checkout.js']");
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function StatusBanners() {
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    const canceled = new URLSearchParams(window.location.search).get("canceled") === "true";
    queueMicrotask(() => setShowCanceled(canceled));
  }, []);

  if (!showCanceled) return null;

  return (
    <div className="creditsNotice">
      <span>Payment was canceled — your credits are unchanged.</span>
      <button className="creditsNoticeClose" onClick={() => setShowCanceled(false)}>✕</button>
    </div>
  );
}

function PaymentSuccessPopup({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null;

  return (
    <div className="paySuccessOverlay" onClick={onClose}>
      <div className="paySuccessCard" onClick={(e) => e.stopPropagation()}>
        <div className="paySuccessConfetti" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="paySuccessConfettiPiece" />
          ))}
        </div>

        <button className="paySuccessClose" type="button" onClick={onClose} aria-label="Close">✕</button>

        <div className="paySuccessCheck" aria-hidden="true">
          <svg viewBox="0 0 52 52">
            <circle className="paySuccessCheckCircle" cx="26" cy="26" r="23" fill="none" />
            <path className="paySuccessCheckMark" fill="none" d="M14 27l7 7 17-17" />
          </svg>
        </div>

        <h2>Payment successful!</h2>
        <p>Your credits have been added to your account.</p>

        <button className="paySuccessBtn" type="button" onClick={onClose}>Continue</button>
      </div>
    </div>
  );
}

function ReceiptModal({
  transaction,
  userEmail,
  onClose,
}: {
  transaction: Transaction;
  userEmail?: string | null;
  onClose: () => void;
}) {
  const plan = isCreditPlanId(transaction.planId) ? CREDIT_PLANS[transaction.planId] : undefined;
  const created = new Date(transaction.createdAt);
  const orderId = (transaction.orderId || transaction.id || "").slice(-10).toUpperCase();

  return (
    <div className="receiptOverlay" onClick={onClose}>
      <div className="receiptCard" onClick={(e) => e.stopPropagation()}>
        <button className="receiptClose" type="button" onClick={onClose} aria-label="Close receipt">
          ✕
        </button>

        <div className="receiptBrand">
          <span className="receiptBrandMark" aria-hidden="true">VF</span>
          <span className="receiptBrandName">VendorFlow</span>
        </div>

        <div className="receiptTableHead">
          <span>Purchased Plan</span>
          <span>Price</span>
        </div>
        <div className="receiptDivider" />

        <div className="receiptRow">
          <span className="receiptRowNum">01</span>
          <div className="receiptRowInfo">
            <div className="receiptItemName">{plan?.name ?? transaction.planId ?? "Credit Plan"}</div>
            <div className="receiptItemSub">
              {transaction.amount} credits{plan?.bonus ? ` (${plan.bonus} bonus included)` : ""}
            </div>
          </div>
          <div className="receiptRowPrice">
            {typeof transaction.priceInr === "number" ? `₹${transaction.priceInr.toLocaleString("en-IN")}` : "—"}
          </div>
        </div>
        <div className="receiptDivider" />

        <div className="receiptTotalRow">
          <span>Total Paid</span>
          <span>
            {typeof transaction.priceInr === "number"
              ? `₹${transaction.priceInr.toLocaleString("en-IN")} INR`
              : "—"}
          </span>
        </div>

        <div className="receiptDivider receiptDividerDashed" />

        <div className="receiptMeta">
          <span>
            {created.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </span>
          <span>{created.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          <span>{orderId}</span>
        </div>

        <div className="receiptBarcode" aria-hidden="true">
          {Array.from({ length: 46 }).map((_, i) => (
            <span key={i} className={i % 5 === 0 ? "isThick" : undefined} />
          ))}
        </div>

        <div className="receiptFooter">
          <strong>VendorFlow</strong>
          <span>AI product image generator for online sellers</span>
          <span>hello@productvisuals.ai</span>
          {userEmail && <span>Billed to: {userEmail}</span>}
        </div>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [showPaySuccess, setShowPaySuccess] = useState(false);
  const [plans, setPlans] = useState<typeof CREDIT_PLANS>(CREDIT_PLANS);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((data) => {
        setBalance(data.balance ?? 0);
        setTransactions(data.transactions ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        if (data.plans) setPlans(data.plans);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const succeeded = new URLSearchParams(window.location.search).get("success") === "true";
    if (succeeded) queueMicrotask(() => setShowPaySuccess(true));
  }, []);

  // Re-fetch on close (not just reuse state) since the webhook that adds the
  // purchase transaction can still be landing while the success animation plays.
  async function closePaySuccess() {
    setShowPaySuccess(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("success");
    window.history.replaceState({}, "", url.toString());

    try {
      const res = await fetch("/api/credits");
      const data = await res.json();
      const txs: Transaction[] = data.transactions ?? [];
      setBalance(data.balance ?? 0);
      setTransactions(txs);
      const latestPurchase = txs.find((tx) => typeof tx.priceInr === "number");
      if (latestPurchase) setViewingTx(latestPurchase);
    } catch {
      // Bill just won't auto-open — the transaction still shows in history once loaded.
    }
  }

  async function buyPlan(planId: string) {
    setBuyingPlan(planId);
    try {
      const scriptLoaded = await loadRazorpayCheckout();
      if (!scriptLoaded || !window.Razorpay) {
        alert("Could not load Razorpay checkout. Please try again.");
        setBuyingPlan(null);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();

      if (!res.ok || !data.orderId || !data.keyId) {
        alert(data.error || "Could not start checkout. Please try again.");
        setBuyingPlan(null);
        return;
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: data.name,
        description: data.description,
        order_id: data.orderId,
        prefill: data.prefill,
        theme: { color: "#0ea5e9" },
        modal: {
          ondismiss: () => {
            setBuyingPlan(null);
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "verify",
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              alert(verifyData.error || "Payment verification failed. Please contact support.");
              return;
            }

            const url = new URL(window.location.href);
            url.searchParams.set("success", "true");
            url.searchParams.delete("canceled");
            window.history.replaceState({}, "", url.toString());
            setShowPaySuccess(true);
          } catch {
            alert("Payment verification failed. Please contact support.");
          } finally {
            setBuyingPlan(null);
          }
        },
      });

      checkout.open();
    } catch {
      alert("Network error. Please try again.");
      setBuyingPlan(null);
    }
  }

  return (
    <main className="creditsPage">
      {/* Header */}
      <header className="creditsHeader">
        <Link href="/studio" className="creditsBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Studio
        </Link>
        <div className="creditsUser">
          <div className="creditsAvatar">
            {session?.user?.name?.[0]?.toUpperCase() ||
              session?.user?.email?.[0]?.toUpperCase() ||
              "U"}
          </div>
          <div>
            <div className="creditsUserName">{session?.user?.name || "User"}</div>
            <div className="creditsUserEmail">{session?.user?.email}</div>
          </div>
          <button className="creditsSignOut" onClick={() => signOut({ redirectTo: "/" })}>
            Sign out
          </button>
        </div>
      </header>

      <div className="creditsMain">
        {/* Status banners */}
        <Suspense fallback={null}>
          <StatusBanners />
        </Suspense>
        <PaymentSuccessPopup show={showPaySuccess} onClose={closePaySuccess} />

        {/* Balance */}
        <div className="creditsBalance">
          <div className="creditsBalanceLabel">Balance</div>
          {loading ? (
            <div className="creditsBalanceSkeleton" />
          ) : (
            <div className="creditsBalanceAmount">
              {balance} Credits
            </div>
          )}
          <div className="creditsBalanceNote">
            {balance === 0
              ? "No credits"
              : `1 Credit = 1 basic image · 5 Credits = 1 A+ image · credits never expire`}
          </div>
        </div>

        {/* Plans */}
        <div className="creditsPlans">
          <p className="creditsSectionTitle">Plans</p>
          <div className="creditsPlanList">
            {(Object.entries(plans) as [CreditPlanId, typeof CREDIT_PLANS[CreditPlanId]][]).map(([id, plan]) => (
              <div key={id} className="creditsPlanRow">
                <div className="creditsPlanInfo">
                  <div className="creditsPlanName">
                    {plan.name}
                    {PLAN_BADGES[id] && (
                      <span className="creditsPlanBadge">{PLAN_BADGES[id]}</span>
                    )}
                  </div>
                  <div className="creditsPlanSub">
                    {plan.credits} credits
                    {plan.bonus > 0 && ` (${plan.bonus} bonus)`}
                  </div>
                </div>
                <div className="creditsPlanAmount">₹{plan.priceInr.toLocaleString()}</div>
                <button
                  className="creditsPlanBtn"
                  onClick={() => buyPlan(id)}
                  disabled={buyingPlan === id}
                >
                  {buyingPlan === id ? "..." : "Buy"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        {transactions.length > 0 && (
          <div className="creditsHistory">
            <p className="creditsSectionTitle">History</p>
            <div className="creditsHistoryList">
              {transactions.map((tx, i) => (
                <div key={tx.id || i} className="creditsHistoryRow">
                  <div className="creditsHistoryDetails">
                    <div className="creditsHistoryDesc">{tx.description}</div>
                    <div className="creditsHistoryDate">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="creditsHistoryRight">
                    {typeof tx.priceInr === "number" && (
                      <button
                        className="creditsHistoryBillBtn"
                        type="button"
                        onClick={() => setViewingTx(tx)}
                      >
                        View Bill
                      </button>
                    )}
                    <div className={`creditsHistoryAmount${tx.amount > 0 ? " isPositive" : ""}`}>
                      {tx.amount > 0 ? "+" : "−"}{Math.abs(tx.amount)} Credits
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {viewingTx && (
        <ReceiptModal
          transaction={viewingTx}
          userEmail={session?.user?.email}
          onClose={() => setViewingTx(null)}
        />
      )}
    </main>
  );
}
