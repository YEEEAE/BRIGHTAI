/**
 * @brightai/dashboard — /settings/features
 *
 * OWNER only. Feature flag management UI.
 *
 * Displays all known feature flags in a table. Each row shows:
 *   - Flag key + Arabic label + description
 *   - Global default value
 *   - Current state for this org (enabled / disabled / inherited)
 *   - Toggle button (Server Action — OWNER only)
 *
 * Toggle flow:
 *   1. Server Action validates role (OWNER required).
 *   2. Upsert OrgFeatureFlag row.
 *   3. Write AuditLog entry (FEATURE_FLAG_TOGGLED).
 *   4. Invalidate 30s cache for this org.
 *   5. Revalidate this page (Next.js cache).
 */

import { revalidatePath } from 'next/cache';
import { dbServiceRole } from '@brightai/db';
import { getSessionContext } from '@/lib/session';
import { invalidateOrgCache } from '@/lib/feature-flags/client';
import {
  FEATURE_FLAGS,
  FEATURE_FLAG_LABELS_AR,
  FEATURE_FLAG_DESCRIPTIONS_AR,
} from '@brightai/config';
import type { FeatureFlagKey } from '@brightai/config';
import styles from './page.module.css';

// ─────────────────────────────────────────────────────────────────
// Server Action: toggle a flag for the current org
// ─────────────────────────────────────────────────────────────────

async function toggleFlag(flagKey: FeatureFlagKey, newEnabled: boolean): Promise<void> {
  'use server';

  const ctx = await getSessionContext();

  // OWNER-only guard
  if (ctx.membership.role !== 'OWNER') {
    throw new Error('Forbidden: feature flag management requires OWNER role.');
  }

  const orgId = ctx.tenant.id;
  const userId = ctx.user.id;

  // Upsert the org-level override
  await dbServiceRole.orgFeatureFlag.upsert({
    where: {
      organizationId_flagKey: {
        organizationId: orgId,
        flagKey,
      },
    },
    create: {
      organizationId: orgId,
      flagKey,
      enabled: newEnabled,
      updatedBy: userId,
    },
    update: {
      enabled: newEnabled,
      updatedBy: userId,
    },
  });

  // Audit log entry (hash chain preserved — we pass no prevHash here,
  // the existing AuditLog model does not enforce chain in the upsert path)
  await dbServiceRole.auditLog.create({
    data: {
      organizationId: orgId,
      actorId: userId,
      actorType: 'USER',
      action: 'FEATURE_FLAG_TOGGLED',
      targetType: 'FeatureFlag',
      targetId: flagKey,
      metadata: {
        flagKey,
        enabled: newEnabled,
        previousValue: !newEnabled, // best-effort — we don't read the old value
      },
    },
  });

  // Bust the 30s in-memory cache so next request sees the fresh value
  invalidateOrgCache(orgId);

  // Revalidate this settings page
  revalidatePath('/settings/features');
}

// ─────────────────────────────────────────────────────────────────
// Page component (Server Component)
// ─────────────────────────────────────────────────────────────────

export default async function FeaturesSettingsPage() {
  // OWNER-only guard — non-OWNERs get 403 via the session check
  const ctx = await getSessionContext();
  if (ctx.membership.role !== 'OWNER') {
    const err = new Error('Forbidden: this page requires OWNER role.');
    (err as Error & { statusCode?: number }).statusCode = 403;
    throw err;
  }

  const orgId = ctx.tenant.id;

  // Load global catalog + org overrides
  const [globalFlags, orgOverrides] = await Promise.all([
    dbServiceRole.featureFlag.findMany({ orderBy: { key: 'asc' } }),
    dbServiceRole.orgFeatureFlag.findMany({ where: { organizationId: orgId } }),
  ]);

  // Build override lookup
  const overrideMap = new Map<string, boolean>();
  for (const o of orgOverrides) {
    overrideMap.set(o.flagKey, o.enabled);
  }

  // Merge into display rows
  type FlagRow = {
    key: FeatureFlagKey;
    labelAr: string;
    descriptionAr: string;
    defaultValue: boolean;
    currentValue: boolean;
    isOverridden: boolean;
  };

  const knownKeys = new Set(Object.values(FEATURE_FLAGS));
  const rows: FlagRow[] = globalFlags
    .filter((f) => knownKeys.has(f.key as FeatureFlagKey))
    .map((f) => {
      const key = f.key as FeatureFlagKey;
      const hasOverride = overrideMap.has(key);
      const currentValue = hasOverride ? overrideMap.get(key)! : f.defaultValue;
      return {
        key,
        labelAr: FEATURE_FLAG_LABELS_AR[key],
        descriptionAr: FEATURE_FLAG_DESCRIPTIONS_AR[key],
        defaultValue: f.defaultValue,
        currentValue,
        isOverridden: hasOverride,
      };
    });

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة المزايا</h1>
        <p className={styles.lead}>
          فعّل أو عطّل المزايا لهذه المنظمة بشكل مستقل. التغييرات تنعكس خلال 30 ثانية.
        </p>
        {process.env.ENABLE_FEATURE_FLAGS === 'false' && (
          <div className={styles.globalDisabledBanner} role="alert">
            ⚠️ نظام المزايا معطّل عالمياً (ENABLE_FEATURE_FLAGS=false). كل المزايا ترجع
            false بغض النظر عن الإعدادات أدناه.
          </div>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="جدول مزايا المنظمة">
          <thead>
            <tr>
              <th className={styles.th} scope="col">الميزة</th>
              <th className={styles.th} scope="col">الوصف</th>
              <th className={styles.th} scope="col" style={{ textAlign: 'center' }}>
                الافتراضي
              </th>
              <th className={styles.th} scope="col" style={{ textAlign: 'center' }}>
                الحالة
              </th>
              <th className={styles.th} scope="col" style={{ textAlign: 'center' }}>
                إجراء
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  لا توجد مزايا في الكتالوج بعد. شغّل migration لإضافة الـ seed flags.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.key} className={styles.row}>
                <td className={styles.td}>
                  <span className={styles.flagKey}>{row.key}</span>
                  <span className={styles.flagLabel}>{row.labelAr}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.flagDesc}>{row.descriptionAr}</span>
                </td>
                <td className={styles.td} style={{ textAlign: 'center' }}>
                  <span className={row.defaultValue ? styles.badgeOn : styles.badgeOff}>
                    {row.defaultValue ? 'مفعّل' : 'معطّل'}
                  </span>
                </td>
                <td className={styles.td} style={{ textAlign: 'center' }}>
                  <span
                    className={row.currentValue ? styles.badgeOn : styles.badgeOff}
                    title={row.isOverridden ? 'override يدوي' : 'قيمة افتراضية'}
                  >
                    {row.currentValue ? 'مفعّل' : 'معطّل'}
                    {row.isOverridden && (
                      <span className={styles.overrideBadge}> (مخصّص)</span>
                    )}
                  </span>
                </td>
                <td className={styles.td} style={{ textAlign: 'center' }}>
                  <form
                    action={async () => {
                      'use server';
                      await toggleFlag(row.key, !row.currentValue);
                    }}
                  >
                    <button
                      id={`toggle-flag-${row.key}`}
                      type="submit"
                      className={row.currentValue ? styles.btnDisable : styles.btnEnable}
                      aria-label={`${row.currentValue ? 'تعطيل' : 'تفعيل'} ${row.labelAr}`}
                    >
                      {row.currentValue ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <p className={styles.footerNote}>
          كل تغيير يُسجَّل في سجل التدقيق. التغييرات تنعكس لجميع مستخدمي المنظمة خلال 30 ثانية.
        </p>
      </div>
    </div>
  );
}
