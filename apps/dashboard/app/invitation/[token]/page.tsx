/**
 * @brightai/dashboard — Invitation accept page
 *
 * /invitation/[token] — public route, signed by the server. Verifies
 * the invitation, asks the user to sign in or sign up, then on
 * completion creates the membership.
 *
 * Phase 0: shows the invitation details. Phase 2: full accept flow.
 */

import { dbServiceRole } from '@brightai/db';
import { ROLE_LABELS_AR } from '@brightai/config';
import { notFound } from 'next/navigation';
import styles from './page.module.css';

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await dbServiceRole.invitation.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true, nameAr: true, slug: true } },
    },
  });

  if (!invitation) notFound();
  if (invitation.acceptedAt) {
    return (
      <main id="main-content" className={styles.root}>
        <h1 className={styles.title}>الدعوة مستخدمة</h1>
        <p className={styles.lead}>هذي الدعوة قبل تم قبولها.</p>
      </main>
    );
  }
  if (invitation.expiresAt < new Date()) {
    return (
      <main id="main-content" className={styles.root}>
        <h1 className={styles.title}>الدعوة منتهية</h1>
        <p className={styles.lead}>صالحية الدعوة انتهت. اطلب من اللي دعاك يعيد الإرسال.</p>
      </main>
    );
  }

  return (
    <main id="main-content" className={styles.root}>
      <h1 className={styles.title}>دعوة لـ {invitation.organization.nameAr ?? invitation.organization.name}</h1>
      <p className={styles.lead}>
        دعاك <strong>{invitation.email}</strong> للانضمام كـ{' '}
        <span className={styles.role}>{ROLE_LABELS_AR[invitation.role]}</span>.
      </p>
      <div className={styles.placeholder}>
        <p>Phase 0 — عرض الدعوة. قبول الدعوة في Phase 2.</p>
      </div>
    </main>
  );
}
