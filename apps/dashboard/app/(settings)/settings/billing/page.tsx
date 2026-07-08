/**
 * @brightai/dashboard — /settings/billing
 *
 * OWNER+ only. Phase 0: placeholder.
 * Phase 1+: Stripe customer portal link, invoice list, plan management.
 */

import { requireSessionRoleAtLeast } from '@/lib/session';
import styles from '../page.module.css';

export default async function BillingSettingsPage() {
  await requireSessionRoleAtLeast('OWNER');

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>الفوترة</h1>
      <p className={styles.lead}>
        صفحة الفوترة (Stripe customer portal + invoice list) توصل في Phase 1.
      </p>
      <div className={styles.placeholder}>
        <p>Phase 0 — placeholder. OWNER gate يشتغل صح ✅</p>
      </div>
    </div>
  );
}
