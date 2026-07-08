/**
 * @brightai/dashboard — Unauthorized page
 *
 * Shown when an authenticated user tries to access a resource they
 * don't have permission for. Mirrors what Clerk's redirect would
 * surface, but gives us control over copy + the path back.
 */

import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { ROLE_LABELS_AR } from '@brightai/config';
import styles from './page.module.css';

export default async function UnauthorizedPage() {
  const { userId } = await auth();

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>ما عندك صلاحية</h1>
      <p className={styles.lead}>
        الحساب اللي مسجّل دخولك فيه ({userId ?? 'مجهول'}) ما عنده صلاحية الوصول لهذي الصفحة.
        لو تبي وصول، تواصل مع مالك أو مشرف المنظمة.
      </p>
      <div className={styles.actions}>
        <Link href="/dashboard" className={styles.primaryBtn}>
          العودة للوحة التحكم
        </Link>
      </div>
      <details className={styles.details}>
        <summary className={styles.summary}>الصلاحيات المتوفرة حسب الدور</summary>
        <dl className={styles.list}>
          {Object.entries(ROLE_LABELS_AR).map(([key, label]) => (
            <div key={key} className={styles.row}>
              <dt className={styles.dt}>{label}</dt>
              <dd className={styles.dd}>{key}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
