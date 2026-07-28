"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "▣" },
  { href: "/admin/users", label: "Users", icon: "◈" },
  { href: "/admin/transactions", label: "Transactions", icon: "◎" },
  { href: "/admin/plans", label: "Plans", icon: "◇" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>VendorFlow Admin</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
