import { getSessionContext } from '@/lib/session';
import { dbServiceRole } from '@brightai/db';
import { requireSessionPermission } from '@/lib/session';
import { ROLE_LABELS_AR } from '@brightai/config';
import styles from './page.module.css';

export default async function PoliciesPage() {
  await requireSessionPermission('policy:read');
  const ctx = await getSessionContext();

  const policies = await dbServiceRole.policy.findMany({
    where: { organizationId: ctx.tenant.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>السياسات</h1>
      <p className={styles.subtitle}>قائمة السياسات في المنظمة</p>

      {policies.length === 0 ? (
        <p className={styles.empty}>ما في سياسات بعد.</p>
      ) : (
        <ul className={styles.list}>
          {policies.map((p) => (
            <li key={p.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{p.nameAr ?? p.name}</h3>
                <span className={`${styles.badge} ${styles[`status_${p.status}`]}`}>
                  {p.status}
                </span>
              </div>
              <p className={styles.cardDesc}>{p.descriptionAr ?? p.description}</p>
              <div className={styles.cardMeta}>
                <span>الفئة: {p.category}</span>
                <span>الأولوية: {p.priority}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
