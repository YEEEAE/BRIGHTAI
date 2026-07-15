/**
 * @brightai/dashboard — (app) route group
 *
 * Main authenticated, tenant-scoped area. Renders a top bar with
 * user info, a sidebar with navigation, and a content slot.
 *
 * Auth/tenant guards:
 *   - `getSessionContext()` enforces auth + active membership.
 *   - If onboarding isn't complete, the (onboarding) layout pushes
 *     the user to /welcome. So this layout assumes onboarding done.
 *
 * Feature flags:
 *   - `resolveFlags()` is called once per request (30s cache).
 *   - `FeatureFlagProvider` injects the resolved map into React Context.
 *   - Client components use `useFeatureFlag(key)` to read flags.
 */

import Link from 'next/link';
import { getSessionContext } from '@/lib/session';
import { resolveFlags } from '@/lib/feature-flags/client';
import { FeatureFlagProvider } from '@/lib/feature-flags/provider';
import { ROLE_LABELS_AR } from '@brightai/config';
import styles from './layout.module.css';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  const flags = await resolveFlags(ctx.tenant.id);

  return (
    <FeatureFlagProvider value={flags}>
      <div className={styles.root}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/dashboard" className={styles.brand}>
              BrightAI
            </Link>
            <span className={styles.tenantName}>
              {ctx.tenant.nameAr ?? ctx.tenant.name}
            </span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {ctx.user.fullNameAr ?? ctx.user.fullName ?? ctx.user.email}
              </span>
              <span className={styles.userRole}>{ROLE_LABELS_AR[ctx.membership.role]}</span>
            </div>
            <div className={styles.avatar}>
              {(ctx.user.fullName ?? ctx.user.email ?? '?').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className={styles.shell}>
          <Sidebar role={ctx.membership.role} />
          <main id="main-content" className={styles.main}>
            {children}
          </main>
        </div>
      </div>
    </FeatureFlagProvider>
  );
}
