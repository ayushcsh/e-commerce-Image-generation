import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAdminStats } from "@/lib/admin";
import styles from "./admin.module.css";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const stats = await getAdminStats();

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const fmtCurrency = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Total Users</div>
          <div className={styles.cardValue}>{fmt(stats.totalUsers)}</div>
          <div className={styles.cardSub}>
            +{stats.newUsersToday} today &nbsp;·&nbsp; +{stats.newUsersThisWeek} this week
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Credits Purchased</div>
          <div className={styles.cardValue}>{fmt(stats.totalCreditsPurchased)}</div>
          <div className={styles.cardSub}>All time</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Total Revenue</div>
          <div className={styles.cardValue}>{fmtCurrency(stats.totalRevenue)}</div>
          <div className={styles.cardSub}>From credit purchases</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Total Generations</div>
          <div className={styles.cardValue}>{fmt(stats.totalGenerations)}</div>
          <div className={styles.cardSub}>All time</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Active Users (7 days)</div>
          <div className={styles.cardValue}>{fmt(stats.activeUsersLast7Days)}</div>
          <div className={styles.cardSub}>Generated at least once</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>New Users This Week</div>
          <div className={styles.cardValue}>{fmt(stats.newUsersThisWeek)}</div>
          <div className={styles.cardSub}>Last 7 days</div>
        </div>
      </div>
    </div>
  );
}
