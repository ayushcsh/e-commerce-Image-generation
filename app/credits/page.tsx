"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { signOut } from "next-auth/react";

type Transaction = {
  type: string;
  amount: number;
  description: string;
  createdAt: string;
};

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    priceInr: 699,
    creditsUsd: 7,
    features: ["50 credits/month", "Basic image sizes", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    priceInr: 1299,
    creditsUsd: 13,
    badge: "Popular",
    features: ["100 credits/month", "All A+ Content sizes", "Priority support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceInr: 4999,
    creditsUsd: 55,
    features: ["Unlimited credits", "All image sizes", "24/7 support", "Custom integrations"],
  },
];

function StatusBanners() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowSuccess(params.get("success") === "true");
    setShowCanceled(params.get("canceled") === "true");
  }, []);

  if (!showSuccess && !showCanceled) return null;

  return (
    <>
      {showSuccess && (
        <div className="creditsNotice isSuccess">
          <span>Payment received — credits have been added to your account.</span>
          <button className="creditsNoticeClose" onClick={() => setShowSuccess(false)}>✕</button>
        </div>
      )}
      {showCanceled && (
        <div className="creditsNotice">
          <span>Payment was canceled — your credits are unchanged.</span>
          <button className="creditsNoticeClose" onClick={() => setShowCanceled(false)}>✕</button>
        </div>
      )}
    </>
  );
}

export default function CreditsPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);

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

  async function claimFreeCredits() {
    setClaiming(true);
    try {
      const res = await fetch("/api/credits/test-grant", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setTransactions((prev) => [
          {
            type: "grant",
            amount: 10,
            description: "Free trial credits",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } finally {
      setClaiming(false);
    }
  }

  async function buyPlan(planId: string) {
    setBuyingPlan(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not start checkout. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
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

        {/* Balance */}
        <div className="creditsBalance">
          <div className="creditsBalanceLabel">Balance</div>
          {loading ? (
            <div className="creditsBalanceSkeleton" />
          ) : (
            <div className="creditsBalanceAmount">
              ₹{(balance * 96).toFixed(0)}
            </div>
          )}
          <div className="creditsBalanceNote">
            {balance === 0
              ? "No credits"
              : `≈ $${balance.toFixed(2)} · credits never expire`}
          </div>
        </div>

        {/* Free credits */}
        <div className="creditsFreeBanner">
          <div>
            <strong>Claim ₹100 free</strong>
            <p>Test the platform — no card needed.</p>
          </div>
          <button
            className="creditsFreeBannerBtn"
            onClick={claimFreeCredits}
            disabled={claiming}
          >
            {claiming ? "..." : "Claim free"}
          </button>
        </div>

        {/* Plans */}
        <div className="creditsPlans">
          <p className="creditsSectionTitle">Plans</p>
          <div className="creditsPlanList">
            {PLANS.map((plan) => (
              <div key={plan.id} className="creditsPlanRow">
                <div className="creditsPlanInfo">
                  <div className="creditsPlanName">
                    {plan.name}
                    {plan.badge && (
                      <span className="creditsPlanBadge">{plan.badge}</span>
                    )}
                  </div>
                  <div className="creditsPlanSub">
                    {plan.creditsUsd} credits · {plan.features[0]}
                  </div>
                </div>
                <div className="creditsPlanAmount">₹{plan.priceInr.toLocaleString()}</div>
                <button
                  className="creditsPlanBtn"
                  onClick={() => buyPlan(plan.id)}
                  disabled={buyingPlan === plan.id}
                >
                  {buyingPlan === plan.id ? "..." : "Buy"}
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
                <div key={i} className="creditsHistoryRow">
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
                  <div className={`creditsHistoryAmount${tx.amount > 0 ? " isPositive" : ""}`}>
                    {tx.amount > 0 ? "+" : "−"}${Math.abs(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
