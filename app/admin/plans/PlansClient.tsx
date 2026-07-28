"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";
import { CREDIT_PLANS, type CreditPlanId } from "@/lib/pricing";

export default function PlansClient() {
  const [plans, setPlans] = useState<Record<CreditPlanId, { priceInr: number; credits: number }>>({
    starter:  { priceInr: CREDIT_PLANS.starter.priceInr,  credits: CREDIT_PLANS.starter.credits },
    growth:   { priceInr: CREDIT_PLANS.growth.priceInr,   credits: CREDIT_PLANS.growth.credits },
    pro:      { priceInr: CREDIT_PLANS.pro.priceInr,      credits: CREDIT_PLANS.pro.credits },
    business: { priceInr: CREDIT_PLANS.business.priceInr, credits: CREDIT_PLANS.business.credits },
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planOrder] = useState<CreditPlanId[]>(["starter", "growth", "pro", "business"]);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((data) => {
        const overrides = data.plans as Partial<Record<CreditPlanId, { priceInr: number; credits: number }>>;
        if (!overrides) return;
        setPlans((prev) => {
          const next = { ...prev };
          for (const id of Object.keys(overrides) as CreditPlanId[]) {
            const o = overrides[id];
            if (o) next[id] = { priceInr: o.priceInr, credits: o.credits };
          }
          return next;
        });
      })
      .catch(() => {});
  }, []);

  const handleChange = (planId: CreditPlanId, field: "priceInr" | "credits", value: string) => {
    setPlans((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: field === "priceInr" ? parseFloat(value) || 0 : parseInt(value) || 0,
      },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Plans & Pricing</h1>

      <div className={styles.section}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
            Edit credit plan pricing. Changes take effect immediately for new purchases.
            (Price changes do not affect existing credit balances.)
          </p>
        </div>

        <div className={styles.plansGrid}>
          {planOrder.map((id) => {
            const plan = CREDIT_PLANS[id];
            return (
              <div key={id} className={styles.planCard}>
                <div className={styles.planName}>{plan.name}</div>
                <div style={{ marginBottom: 12 }}>
                  <div className={styles.formField} style={{ marginBottom: 8 }}>
                    <label className={styles.formLabel}>Price (₹)</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      value={plans[id].priceInr}
                      onChange={(e) => handleChange(id, "priceInr", e.target.value)}
                    />
                  </div>
                  <div className={styles.formField} style={{ marginBottom: 0 }}>
                    <label className={styles.formLabel}>Credits</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      value={plans[id].credits}
                      onChange={(e) => handleChange(id, "credits", e.target.value)}
                    />
                  </div>
                </div>
                {plan.bonus > 0 && (
                  <div className={styles.planBonus}>+{plan.bonus} bonus credits</div>
                )}
              </div>
            );
          })}
        </div>

        {saved && (
          <div className={`${styles.formMsg} ${styles.formMsgSuccess}`}>
            Plans saved successfully!
          </div>
        )}

        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
