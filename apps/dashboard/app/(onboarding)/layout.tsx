/**
 * @brightai/dashboard — (onboarding) route group
 *
 * Renders the 5-step onboarding wizard for organizations that haven't
 * completed it. Protected by auth + tenant context.
 *
 * Phase 0: just the layout + a welcome placeholder. Phase 3+ will
 * build out the actual wizard UI.
 */

import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/session';
import { dbServiceRole } from '@brightai/db';
import styles from './layout.module.css';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();

  // If onboarding is complete, push the user to the dashboard.
  const progress = await dbServiceRole.onboardingProgress.findUnique({
    where: { organizationId: ctx.tenant.id },
  });
  if (progress?.completedAt) {
    redirect('/dashboard');
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <span className={styles.brand}>BrightAI</span>
          <span className={styles.orgName}>{ctx.tenant.nameAr ?? ctx.tenant.name}</span>
        </div>
        <div className={styles.progress}>
          <span className={styles.progressLabel}>
            الخطوة {progress ? progress.completedSteps.length + 1 : 1} من 5
          </span>
        </div>
      </header>
      <main id="main-content" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
