/**
 * @brightai/dashboard — /settings/tenant
 *
 * ADMIN+ only. Phase 0: placeholder.
 * Phase 1+: org name, logo, default policies, deployment mode.
 */

import { requireSessionRoleAtLeast } from '@/lib/session';
import styles from '../page.module.css';

export default async function TenantSettingsPage() {
  await requireSessionRoleAtLeast('ADMIN');

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>إعدادات المنظمة</h1>
      <p className={styles.lead}>
        اسم الشركة، الشعار، إعدادات السياسات الافتراضية، الـ deployment mode.
        يوصلون في Phase 1.
      </p>
      <div className={styles.placeholder}>
        <p>Phase 0 — placeholder. ADMIN gate يشتغل صح ✅</p>
      </div>
    </div>
  );
}
