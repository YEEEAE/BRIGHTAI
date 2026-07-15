/**
 * @brightai/dashboard — /audit (Hash Chain Audit Logs)
 *
 * AUDIT-UI-001 (2026-07-15): tamper-evident audit log viewer with chain verification.
 *
 * Auth: requires `audit:read` permission (OWNER + ADMIN + COMPLIANCE_OFFICER).
 * Feature flag: `audit_ui_enabled` — if disabled, page shows a notice.
 *
 * Server component:
 *   - Permission + feature-flag check.
 *   - Initial fetch of latest audit entries.
 *
 * Client component (`client.tsx`):
 *   - Verify Chain button → POST /api/audit/verify.
 *   - Date range + action filters → GET /api/audit/list.
 *   - Export CSV button → fetches all matching rows + client-side CSV.
 */

import { dbServiceRole } from '@brightai/db';
import { requireSessionPermission, getSessionContext } from '@/lib/session';
import { resolveFlags, getFlag } from '@/lib/feature-flags/client';
import styles from './page.module.css';
import { AuditClient } from './client';

export const dynamic = 'force-dynamic';

const PAGE_LIMIT = 50;

export default async function AuditPage() {
  // 1. Permission check.
  const ctx = await requireSessionPermission('audit:read');

  // 2. Feature flag check.
  const flags = await resolveFlags(ctx.tenant.id);
  const uiEnabled = getFlag(flags, 'audit_ui_enabled');

  if (!uiEnabled) {
    return (
      <div className={styles.root}>
        <div className={styles.disabled}>
          <h2>سجل التدقيق غير مفعّل</h2>
          <p>ميزة سجل التدقيق معطلة لمؤسستك. تواصل مع الدعم لتفعيلها.</p>
        </div>
      </div>
    );
  }

  // 3. Initial fetch — latest 50 entries.
  const [entries, total] = await Promise.all([
    dbServiceRole.auditLog.findMany({
      where: { organizationId: ctx.tenant.id },
      orderBy: { createdAt: 'desc' },
      take: PAGE_LIMIT,
      select: {
        id: true,
        actorId: true,
        actorType: true,
        action: true,
        targetType: true,
        targetId: true,
        ipAddress: true,
        metadata: true,
        hash: true,
        prevHash: true,
        createdAt: true,
      },
    }),
    dbServiceRole.auditLog.count({
      where: { organizationId: ctx.tenant.id },
    }),
  ]);

  // 4. Serialize for client.
  const initialEntries = entries.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
    hashShort: e.hash ? e.hash.slice(0, 12) : '—',
    prevHashShort: e.prevHash ? e.prevHash.slice(0, 12) : '—',
  }));

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1>سجل التدقيق</h1>
          <p>
            سجل ثابت وغير قابل للتعديل لكل العمليات الحساسة في المنظمة. كل صف مربوط بالصف
            السابق عبر SHA-256 — يمكنك التحقق من سلامة السلسلة في أي وقت.
          </p>
        </div>
      </div>
      <AuditClient initialEntries={initialEntries} initialTotal={total} />
    </div>
  );
}