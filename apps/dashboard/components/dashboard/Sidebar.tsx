'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@brightai/db';
import { hasPermission, ROLE_PERMISSIONS } from '@brightai/config';
import type { Permission } from '@brightai/config';
import styles from './Sidebar.module.css';

type NavItem = {
  href: string;
  label: string;
  icon: string;
  permission?: Permission;
};

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'الرئيسية', icon: '◉' },
  { href: '/requests', label: 'الطلبات', icon: '✎', permission: 'request:read:own' },
  { href: '/policies', label: 'السياسات', icon: '⎙', permission: 'policy:read' },
  { href: '/team', label: 'الفريق', icon: '◐', permission: 'member:read' },
  // AUDIT-UI-001 (2026-07-15): hash chain audit logs (feature-flagged).
  { href: '/audit', label: 'سجل التدقيق', icon: '✓', permission: 'audit:read' },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  // Use the canonical permissions table for client-side gating (UI only;
  // the server is the source of truth).
  const granted = new Set<Permission>(ROLE_PERMISSIONS[role]);

  return (
    <aside className={styles.sidebar} aria-label="القائمة الجانبية">
      <nav className={styles.nav}>
        {NAV.filter((item) => !item.permission || hasPermission(role, item.permission)).map(
          (item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${active ? styles.linkActive : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles.icon} aria-hidden>
                  {item.icon}
                </span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            );
          },
        )}
      </nav>
      <div className={styles.foot}>
        <p className={styles.footText}>
          {granted.size} صلاحية ممنوحة
        </p>
      </div>
    </aside>
  );
}
