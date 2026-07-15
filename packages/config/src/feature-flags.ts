/**
 * @brightai/config — Feature Flag keys
 *
 * Single source of truth for all flag keys shared across:
 *   - packages/db (FeatureFlag.key column)
 *   - apps/dashboard/lib/feature-flags/client.ts (resolver)
 *   - apps/dashboard/lib/feature-flags/hook.ts (useFeatureFlag)
 *   - apps/dashboard/app/(settings)/settings/features/page.tsx (admin UI)
 *
 * Adding a new flag:
 *   1. Add to FEATURE_FLAGS object below.
 *   2. Add Arabic label to FEATURE_FLAG_LABELS_AR.
 *   3. Add description to FEATURE_FLAG_DESCRIPTIONS_AR.
 *   4. Add DB row via migration seed (INSERT ... ON CONFLICT DO NOTHING).
 *
 * Removing a flag:
 *   1. Remove from this file.
 *   2. Leave the DB row (soft-warn in resolveFlags(), no break).
 *   3. Hard-delete the DB row only after all code references are gone.
 */

// ─────────────────────────────────────────────────────────────────
// Flag key registry
// ─────────────────────────────────────────────────────────────────

export const FEATURE_FLAGS = {
  /** SSE streaming chat (BAI-006). Reduces time-to-first-token from ~3s to <500ms. */
  AI_STREAMING: 'ai_streaming',

  /** Arabic NER detector in the AI firewall. Detects Arabic PII entities. */
  FIREWALL_NER_ENABLED: 'firewall_ner_enabled',

  /** New pricing tier and detailed invoicing (billing v2). */
  BILLING_V2: 'billing_v2',

  /** Audit trail page in Dashboard (BAI-018). Full event viewer. */
  AUDIT_UI_ENABLED: 'audit_ui_enabled',

  /** SAML/OIDC SSO login — enterprise identity provider integration. */
  SSO_ENABLED: 'sso_enabled',
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

// ─────────────────────────────────────────────────────────────────
// Human-readable labels (Saudi Arabic) — used in admin UI
// ─────────────────────────────────────────────────────────────────

export const FEATURE_FLAG_LABELS_AR: Record<FeatureFlagKey, string> = {
  ai_streaming: 'بث AI (SSE)',
  firewall_ner_enabled: 'كاشف PII العربي (NER)',
  billing_v2: 'الفوترة v2',
  audit_ui_enabled: 'سجل التدقيق',
  sso_enabled: 'تسجيل SAML/OIDC (SSO)',
};

export const FEATURE_FLAG_DESCRIPTIONS_AR: Record<FeatureFlagKey, string> = {
  ai_streaming:
    'يحوّل المحادثة من انتظار الرد الكامل (~3 ثواني) إلى بث فوري (<500ms لأول كلمة). يتطلب متصفح يدعم SSE.',
  firewall_ner_enabled:
    'يفعّل كاشف التعرف على الكيانات العربية (اسم، هوية وطنية، رقم جوال) في Firewall. يزيد دقة PII detection للعربية.',
  billing_v2:
    'يفتح نظام الفوترة الجديد: طبقات تسعير متعددة، فواتير تفصيلية، وتقارير الاستخدام الشهري.',
  audit_ui_enabled:
    'يظهر صفحة سجل التدقيق الكاملة في Dashboard: جدول يعرض كل الإجراءات والأحداث مع التصفية والتصدير.',
  sso_enabled:
    'يتيح تسجيل الدخول عبر SAML 2.0 / OIDC مع هوية المؤسسة (Microsoft Entra، Okta، ADFS، إلخ).',
};

// ─────────────────────────────────────────────────────────────────
// Validation helper — used in resolveFlags() to soft-warn on
// unknown keys that exist in DB but not in this registry.
// ─────────────────────────────────────────────────────────────────

const KNOWN_FLAG_KEYS = new Set<string>(Object.values(FEATURE_FLAGS));

export function isKnownFlagKey(key: string): key is FeatureFlagKey {
  return KNOWN_FLAG_KEYS.has(key);
}
