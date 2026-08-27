/**
 * @brightai/dashboard — Main dashboard page
 *
 * Phase 0: shows org name, role, membership status, and a few key
 * counters. Phase 1+ will replace with real metrics.
 */

import { getSessionContext, runInTenantContext } from '@/lib/session';
import { ROLE_DESCRIPTIONS_AR } from '@brightai/config';
import styles from './page.module.css';

export default async function DashboardPage() {
  const ctx = await getSessionContext();

  // Tenant-scoped counters — RLS via runInTenantContext enforces isolation.
  // No manual organizationId filter needed.
  const [policiesCount, pendingRequests, teamSize] = await runInTenantContext(
    ctx,
    (tx) =>
      Promise.all([
        tx.policy.count(),
        tx.aIRequest.count({ where: { status: 'PENDING' } }),
        tx.membership.count({ where: { status: 'ACTIVE' } }),
      ]),
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>لوحة التحكم</h1>
        <p className={styles.subtitle}>
          {ctx.tenant.nameAr ?? ctx.tenant.name} • {ctx.tenant.slug}.brightai.live
        </p>
      </header>

      <div className={styles.welcome}>
        <h2 className={styles.welcomeTitle}>
          أهلاً {ctx.user.fullNameAr ?? ctx.user.fullName ?? ctx.user.email ?? 'مستخدم'}
        </h2>
        <p className={styles.welcomeLead}>
          أنت مسجّل دخولك بدور{' '}
          <span className={styles.role}>{ctx.membership.role}</span>
          {' — '}
          {ROLE_DESCRIPTIONS_AR[ctx.membership.role]}.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>السياسات النشطة</span>
          <span className={styles.cardValue}>{policiesCount}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>طلبات قيد المراجعة</span>
          <span className={styles.cardValue}>{pendingRequests}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>أعضاء الفريق</span>
          <span className={styles.cardValue}>{teamSize}</span>
        </div>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>وش جاي في الـ releases القادمة</h3>
        <ul className={styles.list}>
          <li>
            <strong>Phase 1</strong> — Sign-up flow مع Company + Owner، Sign-in، Password Reset،
            Email Verification (SendGrid)، 2FA (Authenticator + SMS Unifonic).
          </li>
          <li>
            <strong>Phase 2</strong> — Multi-tenant switcher، RBAC الكامل، Audit log viewer.
          </li>
          <li>
            <strong>Phase 3</strong> — Onboarding wizard (5 خطوات)، Team invites + bulk CSV.
          </li>
          <li>
            <strong>Phase 4</strong> — Custom domain (CNAME flow)، API keys، Integrations.
          </li>
        </ul>
      </section>
    </div>
  );
}
