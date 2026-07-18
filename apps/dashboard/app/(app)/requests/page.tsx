/**
 * @brightai/dashboard — /requests placeholder
 *
 * Phase 0: lists the seed requests. Phase 1+ replaces with a full
 * approval queue + filters + drawer.
 */

import { runInTenantContext, requireSessionPermission } from '@/lib/session';
import { ROLE_LABELS_AR } from '@brightai/config';
import styles from './page.module.css';

export default async function RequestsPage() {
  const ctx = await requireSessionPermission('request:read:own');

  const requests = await runInTenantContext(ctx, (tx) =>
    tx.aIRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        requestedBy: { select: { fullName: true, fullNameAr: true, email: true } },
        reviewedBy: { select: { fullName: true, fullNameAr: true, email: true } },
      },
    }),
  );

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>الطلبات</h1>
      <p className={styles.subtitle}>آخر 50 طلب على مستوى المنظمة</p>

      {requests.length === 0 ? (
        <p className={styles.empty}>ما في طلبات.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>الطلب</th>
              <th>مقدّم الطلب</th>
              <th>الخطر</th>
              <th>الحالة</th>
              <th>المراجع</th>
              <th>التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td className={styles.prompt}>{r.prompt}</td>
                <td>{r.requestedBy.fullNameAr ?? r.requestedBy.fullName ?? r.requestedBy.email}</td>
                <td>
                  <span className={`${styles.badge} ${styles[`risk_${r.riskLevel}`]}`}>
                    {r.riskLevel}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[`status_${r.status}`]}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  {r.reviewedBy?.fullNameAr ?? r.reviewedBy?.fullName ?? r.reviewedBy?.email ?? '—'}
                </td>
                <td className={styles.date}>{new Date(r.createdAt).toLocaleString('ar-SA')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className={styles.phaseNote}>
        Phase 0 — عرض read-only. الـ approval queue + filters + drawer في Phase 1.
      </p>
    </div>
  );
}
