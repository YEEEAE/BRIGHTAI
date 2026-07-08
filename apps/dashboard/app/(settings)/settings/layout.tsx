/**
 * @brightai/dashboard — (settings) route group
 *
 * Tenant-scoped settings. Sub-routes:
 *   /settings/profile   — user profile (Clerk UserProfile)
 *   /settings/security  — 2FA, passkeys, sessions (Clerk UserProfile)
 *   /settings/billing   — OWNER+ only
 *   /settings/tenant    — ADMIN+ only
 *
 * Phase 0: layout + a /settings index that links out. Real forms in
 * Phase 1+.
 */

import Link from 'next/link';
import { getSessionContext } from '@/lib/session';
import styles from './layout.module.css';

const SETTINGS_NAV = [
  { href: '/settings/profile', label: 'الملف الشخصي' },
  { href: '/settings/security', label: 'الأمان' },
  { href: '/settings/billing', label: 'الفوترة', minRole: 'OWNER' as const },
  { href: '/settings/tenant', label: 'إعدادات المنظمة', minRole: 'ADMIN' as const },
];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  const ROLE_RANK = { OWNER: 100, ADMIN: 80, COMPLIANCE_OFFICER: 60, REVIEWER: 40, MEMBER: 20 } as const;
  const rank = ROLE_RANK[ctx.membership.role];

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar} aria-label="قائمة الإعدادات">
        <h2 className={styles.sidebarTitle}>الإعدادات</h2>
        <nav className={styles.nav}>
          {SETTINGS_NAV.filter((item) => !item.minRole || ROLE_RANK[item.minRole] <= rank).map(
            (item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </aside>
      <main id="main-content" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
