"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { CREDIT_PLANS, GST_RATE, isCreditPlanId, splitGstInclusive, type CreditPlanId } from "@/lib/pricing";

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
  const { base, gst } = typeof transaction.priceInr === "number"
    ? splitGstInclusive(transaction.priceInr)
    : { base: 0, gst: 0 };
  const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

        {typeof transaction.priceInr === "number" && (
          <div className="receiptTaxBlock">
            <div className="receiptSubRow">
              <span>Taxable Amount</span>
              <span>{inr(base)}</span>
            </div>
            <div className="receiptSubRow">
              <span>CGST ({(GST_RATE * 50).toFixed(1)}%)</span>
              <span>{inr(gst / 2)}</span>
            </div>
            <div className="receiptSubRow">
              <span>SGST ({(GST_RATE * 50).toFixed(1)}%)</span>
              <span>{inr(gst / 2)}</span>
            </div>
          </div>
        )}

        <div className="receiptTotalRow">
          <span>Total Paid</span>
          <span>
            {typeof transaction.priceInr === "number"
              ? `₹${transaction.priceInr.toLocaleString("en-IN")} INR`
              : "—"}
          </span>
        </div>
        <div className="receiptTotalNote">Inclusive of {(GST_RATE * 100).toFixed(0)}% GST</div>

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
            {(Object.entries(CREDIT_PLANS) as [CreditPlanId, typeof CREDIT_PLANS[CreditPlanId]][]).map(([id, plan]) => (
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
