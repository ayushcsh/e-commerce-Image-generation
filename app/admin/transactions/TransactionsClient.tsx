"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  priceInr?: number;
  planId?: string;
  createdAt: string;
  userEmail: string;
}

export default function TransactionsClient({
  initialType,
  initialPage,
}: {
  initialType: string;
  initialPage: number;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [type, setType] = useState(initialType);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchTxns = useCallback(async (t?: string, p?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (t && t !== "all") params.set("type", t);
      if (p) params.set("page", String(p));
      const res = await fetch(`/api/admin/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTxns(type, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = (newType: string) => {
    setType(newType);
    setPage(1);
    fetchTxns(newType, 1);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const badgeClass = (t: string) => {
    if (t === "grant") return styles.badgeGrant;
    if (t === "charge") return styles.badgeCharge;
    if (t === "deduct") return styles.badgeDeduct;
    return styles.badgeRefund;
  };

  const amountClass = (n: number) =>
    n >= 0 ? styles.badgePositive : styles.badgeNegative;

  const fmtCurrency = (n: number) =>
    "₹" + (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div>
      <h1 className={styles.pageTitle}>Transactions</h1>

      <div className={styles.section}>
        <div className={styles.toolbar}>
          <select
            className={styles.select}
            value={type}
            onChange={(e) => handleFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="grant">Grants</option>
            <option value="charge">Charges</option>
            <option value="deduct">Deductions</option>
            <option value="refund">Refunds</option>
          </select>
          <span className={styles.pageInfo}>{total} total records</span>
        </div>

        {loading ? (
          <p style={{ color: "#888", fontSize: 14 }}>Loading...</p>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Credits</th>
                  <th>Amount (₹)</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#aaa", padding: 24 }}>
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t._id}>
                      <td className={styles.dateCell}>{formatDate(t.createdAt)}</td>
                      <td className={styles.emailCell}>{t.userEmail}</td>
                      <td>
                        <span className={`${styles.badge} ${badgeClass(t.type)}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className={amountClass(t.amount)}>
                        {t.amount > 0 ? "+" : ""}
                        {t.amount}
                      </td>
                      <td>{t.priceInr ? fmtCurrency(t.priceInr) : "—"}</td>
                      <td style={{ fontSize: 13, color: "#666", maxWidth: 200 }}>
                        {t.description || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
