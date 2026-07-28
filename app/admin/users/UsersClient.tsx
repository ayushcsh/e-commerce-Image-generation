"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";

interface User {
  _id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  balance: number;
  disabled: boolean;
}

export default function UsersClient({ initialPage }: { initialPage: number }) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [grantAmount, setGrantAmount] = useState("");
  const [grantDesc, setGrantDesc] = useState("");
  const [deductAmount, setDeductAmount] = useState("");
  const [deductReason, setDeductReason] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = useCallback(async (s?: string, p?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (s) params.set("search", s);
      if (p) params.set("page", String(p));
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.pages || 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(search, 1);
  };

  const openGrant = (user: User) => {
    setSelectedUser(user);
    setGrantAmount("");
    setGrantDesc("");
    setMsg(null);
    setShowGrantModal(true);
  };

  const openDeduct = (user: User) => {
    setSelectedUser(user);
    setDeductAmount("");
    setDeductReason("");
    setMsg(null);
    setShowDeductModal(true);
  };

  const submitGrant = async () => {
    if (!selectedUser || !grantAmount) return;
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "grant",
        email: selectedUser.email,
        amount: grantAmount,
        description: grantDesc || "Admin grant",
      }),
    });
    const data = await res.json();
    if (data.success) {
      setMsg({ type: "success", text: `Granted ${grantAmount} credits to ${selectedUser.email}` });
      setShowGrantModal(false);
      fetchUsers(search, page);
    } else {
      setMsg({ type: "error", text: data.error || "Failed" });
    }
  };

  const submitDeduct = async () => {
    if (!selectedUser || !deductAmount) return;
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deduct",
        userId: selectedUser._id,
        amount: deductAmount,
        reason: deductReason || "Admin deduction",
      }),
    });
    const data = await res.json();
    if (data.success) {
      setMsg({ type: "success", text: `Deducted ${deductAmount} credits from ${selectedUser.email}` });
      setShowDeductModal(false);
      fetchUsers(search, page);
    } else {
      setMsg({ type: "error", text: data.error || "Failed" });
    }
  };

  const toggleDisable = async (user: User) => {
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: user.disabled ? "enable" : "disable",
        userId: user._id,
      }),
    });
    fetchUsers(search, page);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div>
      <h1 className={styles.pageTitle}>Users</h1>

      <div className={styles.section}>
        <form onSubmit={handleSearch} className={styles.toolbar}>
          <input
            className={styles.searchInput}
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            Search
          </button>
          {(search || page > 1) && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => { setSearch(""); setPage(1); fetchUsers("", 1); }}
            >
              Clear
            </button>
          )}
        </form>

        {loading ? (
          <p style={{ color: "#888", fontSize: 14 }}>Loading...</p>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Credits</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "#aaa", padding: 24 }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td className={styles.emailCell}>
                        {u.email}{" "}
                        <span className={u.disabled ? styles.disabledBadge : styles.enabledBadge}>
                          {u.disabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{formatDate(u.createdAt)}</td>
                      <td style={{ fontWeight: 600, color: "#6366f1" }}>
                        {u.balance}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className={`${styles.btn} ${styles.btnSm} ${styles.btnPrimary}`}
                            onClick={() => openGrant(u)}
                          >
                            Grant
                          </button>
                          <button
                            className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`}
                            onClick={() => openDeduct(u)}
                          >
                            Deduct
                          </button>
                          <button
                            className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
                            onClick={() => toggleDisable(u)}
                          >
                            {u.disabled ? "Enable" : "Disable"}
                          </button>
                        </div>
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

      {/* Grant Modal */}
      {showGrantModal && selectedUser && (
        <div className={styles.modal} onClick={() => setShowGrantModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Grant Credits</div>
            <p style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
              Grant credits to <strong>{selectedUser.email}</strong>
            </p>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Credits</label>
              <input
                className={styles.formInput}
                type="number"
                min="1"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Description (optional)</label>
              <input
                className={styles.formInput}
                type="text"
                value={grantDesc}
                onChange={(e) => setGrantDesc(e.target.value)}
                placeholder="e.g. Support compensation"
              />
            </div>
            {msg && (
              <div className={`${styles.formMsg} ${msg.type === "success" ? styles.formMsgSuccess : styles.formMsgError}`}>
                {msg.text}
              </div>
            )}
            <div className={styles.formActions}>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => setShowGrantModal(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={submitGrant}
              >
                Grant Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deduct Modal */}
      {showDeductModal && selectedUser && (
        <div className={styles.modal} onClick={() => setShowDeductModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>Deduct Credits</div>
            <p style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
              Deduct credits from <strong>{selectedUser.email}</strong> (current: {selectedUser.balance})
            </p>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Credits to Deduct</label>
              <input
                className={styles.formInput}
                type="number"
                min="1"
                max={selectedUser.balance}
                value={deductAmount}
                onChange={(e) => setDeductAmount(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Reason</label>
              <input
                className={styles.formInput}
                type="text"
                value={deductReason}
                onChange={(e) => setDeductReason(e.target.value)}
                placeholder="e.g. Refund request"
              />
            </div>
            {msg && (
              <div className={`${styles.formMsg} ${msg.type === "success" ? styles.formMsgSuccess : styles.formMsgError}`}>
                {msg.text}
              </div>
            )}
            <div className={styles.formActions}>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => setShowDeductModal(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={submitDeduct}
              >
                Deduct Credits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
