/**
 * @brightai/dashboard — /settings/sso (Enterprise SSO Configuration)
 *
 * SSO-001 (2026-07-15): OWNER-only settings page for SAML/OIDC configuration.
 *
 * Phase 1 implementation:
 *   - Feature flag `sso_enabled` gates the whole page.
 *   - Form lets OWNER configure provider + email domains + role mapping.
 *   - Status card shows current SamlConnection state.
 *   - All actions write hash-chained audit entries.
 *
 * End-to-end SSO (Azure AD / Okta / Google Workspace) requires:
 *   1. Clerk Pro/Production plan upgrade ($$).
 *   2. Clerk Dashboard Enterprise connection setup.
 *   3. Phase 2: IdP metadata fetch + test flow.
 */

import { dbServiceRole } from '@brightai/db';
import { requireSessionRoleAtLeast } from '@/lib/session';
import { resolveFlags } from '@/lib/feature-flags/client';
import styles from './page.module.css';
import { configureSsoAction, disableSsoAction } from './actions';

// HTML <form action> expects `(formData) => void | Promise<void>`.
// Our server actions return `Promise<ActionResult>` so the page can
// surface success/error messages. For raw form submission we wrap
// them so the return value is discarded — UX feedback still flows
// through `searchParams` / revalidation when needed.
const handleConfigure = (formData: FormData) => {
  void configureSsoAction(formData);
};
const handleDisable = () => {
  void disableSsoAction();
};

export const dynamic = 'force-dynamic';

export default async function SsoSettingsPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const ctx = await requireSessionRoleAtLeast('OWNER');
  const flags = await resolveFlags(ctx.tenant.id);
  const ssoEnabled = flags['sso_enabled'];

  // Phase 1: feature flag gate.
  // إذا الـ flag معطّل، نعرض رسالة + روابط للتفعيل.
  if (!ssoEnabled) {
    return (
      <div className={styles.root}>
        <h1 className={styles.title}>تسجيل الدخول الموحد (SSO)</h1>
        <p className={styles.lead}>
          SAML 2.0 / OIDC للدخول الموحد مع هوية المؤسسة (Microsoft Entra، Okta، Google Workspace).
          هذه الميزة متاحة على الباقة Enterprise فقط.
        </p>
        <div className={styles.notice}>
          <h2 className={styles.noticeTitle}>الميزة غير مفعّلة</h2>
          <p className={styles.noticeBody}>
            SSO يحتاج ترقية Clerk إلى Production/Enterprise وتفعيل Feature Flag على مستوى المنظمة.
            تواصل مع فريق المبيعات للترقية.
          </p>
          <div className={styles.noticeActions}>
            <a href="/settings/billing" className={`${styles.button} ${styles.buttonPrimary}`}>
              عرض الباقات
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Load existing connection.
  const conn = await dbServiceRole.samlConnection.findUnique({
    where: { organizationId: ctx.tenant.id },
  });

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>تسجيل الدخول الموحد (SSO)</h1>
      <p className={styles.lead}>
        يتيح SSO للموظفين تسجيل الدخول باستخدام بيانات اعتماد مؤسستهم. Clerk يدير بروتوكول SAML فعلياً؛
        نخزن هنا الإعدادات الخاصة بمنظمتك (المزوّد، نطاقات البريد، تعيين الأدوار).
      </p>

      {searchParams.success === 'configured' && (
        <div className={styles.success} role="status">✓ تم تكوين الاتصال بنجاح.</div>
      )}
      {searchParams.success === 'disabled' && (
        <div className={styles.success} role="status">✓ تم إيقاف الاتصال.</div>
      )}
      {searchParams.error && (
        <div className={styles.error} role="alert">{searchParams.error}</div>
      )}

      {/* Status card */}
      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <h2 className={styles.formTitle}>الحالة الحالية</h2>
          <span
            className={`${styles.statusBadge} ${
              conn?.enabled ? styles.statusBadgeActive : styles.statusBadgeInactive
            }`}
          >
            {conn?.enabled ? '✓ مفعّل' : '○ غير مفعّل'}
          </span>
        </div>
        <div className={styles.statusRow}>
          <div className={styles.statusLabel}>المزوّد</div>
          <div className={styles.statusValue}>{conn?.provider ?? '— غير مكوّن'}</div>
        </div>
        <div className={styles.statusRow}>
          <div className={styles.statusLabel}>نطاقات البريد</div>
          <div className={styles.statusValue}>
            {conn?.emailDomains?.join(', ') || '—'}
          </div>
        </div>
        <div className={styles.statusRow}>
          <div className={styles.statusLabel}>Clerk Connection ID</div>
          <div className={styles.statusValue}>{conn?.clerkEnterpriseSsoId ?? '—'}</div>
        </div>
        <div className={styles.statusRow}>
          <div className={styles.statusLabel}>آخر تسجيل دخول SSO</div>
          <div className={styles.statusValue}>
            {conn?.lastSsoLoginAt
              ? new Date(conn.lastSsoLoginAt).toLocaleString('ar-SA')
              : '— لم يسجل أحد دخول بعد'}
          </div>
        </div>
        {conn?.enabled && (
          <form action={handleDisable} className={styles.actions}>
            <button type="submit" className={`${styles.button} ${styles.buttonDanger}`}>
              إيقاف SSO
            </button>
          </form>
        )}
      </div>

      {/* Configuration form */}
      <div className={styles.formSection}>
        <h2 className={styles.formTitle}>{conn?.enabled ? 'تحديث الإعدادات' : 'إعداد SSO'}</h2>
        <form action={handleConfigure} className={styles.formGrid}>
          <label className={styles.formLabel} htmlFor="sso-provider">المزوّد</label>
          <div>
            <select
              id="sso-provider"
              name="provider"
              className={styles.formSelect}
              defaultValue={conn?.provider ?? 'azure_ad'}
            >
              <option value="azure_ad">Microsoft Entra ID (Azure AD)</option>
              <option value="okta">Okta</option>
              <option value="google_workspace">Google Workspace</option>
              <option value="generic">Generic SAML 2.0 / OIDC</option>
            </select>
            <p className={styles.formHelp}>
              اختر المزوّد الأقرب لـ IdP مؤسستك. Clerk يدير باقي التفاصيل.
            </p>
          </div>

          <label className={styles.formLabel} htmlFor="sso-domains">نطاقات البريد</label>
          <div>
            <input
              id="sso-domains"
              name="emailDomains"
              type="text"
              className={styles.formInput}
              defaultValue={conn?.emailDomains?.join(', ') ?? ''}
              placeholder="acme.com, acme.sa"
              required
            />
            <p className={styles.formHelp}>
              مفصولة بفواصل. أي إيميل ينتهي بأحد هذه النطاقات يحوَّل تلقائياً لـ SSO.
            </p>
          </div>

          <label className={styles.formLabel} htmlFor="sso-role-mapping">تعيين الأدوار (اختياري)</label>
          <div>
            <input
              id="sso-role-mapping"
              name="roleMappingHint"
              type="text"
              className={styles.formInput}
              defaultValue={conn?.roleMapping ? JSON.stringify(conn.roleMapping) : ''}
              placeholder='{"admins": "ADMIN", "compliance": "COMPLIANCE_OFFICER"}'
            />
            <p className={styles.formHelp}>
              JSON يربط IdP groups claim بأدوار BrightAI. Phase 2: اختبار end-to-end.
            </p>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>
              {conn?.enabled ? 'تحديث' : 'تفعيل SSO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}