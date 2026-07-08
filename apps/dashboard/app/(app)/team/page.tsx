import { getSessionContext } from '@/lib/session';
import { dbServiceRole } from '@brightai/db';
import { requireSessionPermission } from '@/lib/session';
import { ROLE_LABELS_AR } from '@brightai/config';
import styles from './page.module.css';

export default async function TeamPage() {
  await requireSessionPermission('member:read');
  const ctx = await getSessionContext();

  const members = await dbServiceRole.membership.findMany({
    where: { organizationId: ctx.tenant.id },
    include: { user: { select: { email: true, fullName: true, fullNameAr: true, twoFactorEnabled: true } } },
    orderBy: { joinedAt: 'desc' },
  });

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>الفريق</h1>
      <p className={styles.subtitle}>{members.length} عضو</p>

      <ul className={styles.list}>
        {members.map((m) => (
          <li key={m.id} className={styles.row}>
            <div className={styles.avatar}>
              {(m.user.fullName ?? m.user.email).charAt(0).toUpperCase()}
            </div>
            <div className={styles.info}>
              <div className={styles.name}>
                {m.user.fullNameAr ?? m.user.fullName ?? m.user.email}
              </div>
              <div className={styles.email}>{m.user.email}</div>
            </div>
            <div className={styles.meta}>
              <span className={styles.role}>{ROLE_LABELS_AR[m.role]}</span>
              <span className={`${styles.status} ${styles[`status_${m.status}`]}`}>
                {m.status}
              </span>
              {m.user.twoFactorEnabled && <span className={styles.twofa}>2FA</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
