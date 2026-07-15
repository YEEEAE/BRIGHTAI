/**
 * @brightai/config — Constants and enums shared across the monorepo.
 *
 * This file is the single source of truth for:
 * - RBAC roles (5 levels)
 * - Permission codes (resource:action)
 * - Industry / size / deployment / compliance enums
 * - Onboarding step definitions
 *
 * NOTE: any change here MUST be reflected in:
 * - packages/db/prisma/schema.prisma (enum declarations)
 * - packages/db/prisma/policies/rls.sql (RLS grants)
 * - apps/dashboard/lib/auth/* (server-side guards)
 */

// ─────────────────────────────────────────────────────────────────
// RBAC — 5 roles
// ─────────────────────────────────────────────────────────────────

/**
 * Role hierarchy (descending power):
 *   OWNER > ADMIN > COMPLIANCE_OFFICER > REVIEWER > MEMBER
 *
 * Membership uses the highest role when a user belongs to multiple
 * organizations. Switching tenants never escalates role.
 */
export const ROLES = [
  'OWNER',
  'ADMIN',
  'COMPLIANCE_OFFICER',
  'REVIEWER',
  'MEMBER',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_RANK: Record<Role, number> = {
  OWNER: 100,
  ADMIN: 80,
  COMPLIANCE_OFFICER: 60,
  REVIEWER: 40,
  MEMBER: 20,
};

/** Human-readable labels (Saudi Arabic). Used in dashboard UI. */
export const ROLE_LABELS_AR: Record<Role, string> = {
  OWNER: 'مالك',
  ADMIN: 'مشرف',
  COMPLIANCE_OFFICER: 'مسؤول امتثال',
  REVIEWER: 'مراجع',
  MEMBER: 'عضو',
};

export const ROLE_DESCRIPTIONS_AR: Record<Role, string> = {
  OWNER: 'كل الصلاحيات + إدارة الفوترة + حذف المنظمة',
  ADMIN: 'كل الصلاحيات عدا الفوترة + إدارة الفريق',
  COMPLIANCE_OFFICER: 'التدقيق + التقارير + الموافقات + إدارة السياسات',
  REVIEWER: 'الموافقات على الطلبات فقط',
  MEMBER: 'استخدام الذكاء الاصطناعي فقط',
};

// ─────────────────────────────────────────────────────────────────
// Permission codes (resource:action)
// ─────────────────────────────────────────────────────────────────

export const PERMISSIONS = [
  // Organization
  'org:read',
  'org:update',
  'org:delete',
  'org:billing:read',
  'org:billing:manage',

  // Members
  'member:read',
  'member:invite',
  'member:update-role',
  'member:deactivate',
  'member:remove',

  // Policies
  'policy:read',
  'policy:create',
  'policy:update',
  'policy:delete',
  'policy:approve',

  // AI Requests
  'request:create',
  'request:read:own',
  'request:read:all',
  'request:approve',
  'request:reject',

  // Reports
  'report:read:own',
  'report:read:all',
  'report:export',

  // Audit log
  'audit:read',

  // Integrations
  'integration:read',
  'integration:configure',

  // API keys
  'apikey:read',
  'apikey:create',
  'apikey:revoke',

  // Settings
  'settings:read',
  'settings:update',

  // Feature flags (admin UI toggle)
  'feature:manage',

  // Support (impersonation — server-side only)
  'support:impersonate',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// ─────────────────────────────────────────────────────────────────
// Role → Permission matrix
// ─────────────────────────────────────────────────────────────────

/**
 * What each role can do. Adding a permission here is the ONLY way to
 * grant it — server-side guards check this matrix before every mutation.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: [
    // Owner gets everything except support:impersonate (which is server-only)
    ...PERMISSIONS.filter((p) => p !== 'support:impersonate'),
  ],
  ADMIN: [
    'org:read',
    'org:update',
    'member:read',
    'member:invite',
    'member:update-role',
    'member:deactivate',
    'member:remove',
    'policy:read',
    'policy:create',
    'policy:update',
    'policy:delete',
    'policy:approve',
    'request:create',
    'request:read:own',
    'request:read:all',
    'request:approve',
    'request:reject',
    'report:read:own',
    'report:read:all',
    'report:export',
    'audit:read',
    'integration:read',
    'integration:configure',
    'apikey:read',
    'apikey:create',
    'apikey:revoke',
    'settings:read',
    'settings:update',
  ],
  COMPLIANCE_OFFICER: [
    'org:read',
    'member:read',
    'policy:read',
    'policy:create',
    'policy:update',
    'policy:approve',
    'request:read:all',
    'request:approve',
    'request:reject',
    'report:read:all',
    'report:export',
    'audit:read',
    'integration:read',
    'settings:read',
  ],
  REVIEWER: [
    'org:read',
    'member:read',
    'policy:read',
    'request:read:all',
    'request:approve',
    'request:reject',
    'report:read:all',
    'settings:read',
  ],
  MEMBER: [
    'org:read',
    'member:read',
    'policy:read',
    'request:create',
    'request:read:own',
    'report:read:own',
    'settings:read',
  ],
};

/** Throw if a future code introduces a typo in the matrix. */
function _validateMatrix(): void {
  const validPerms = new Set<string>(PERMISSIONS);
  for (const role of ROLES) {
    for (const perm of ROLE_PERMISSIONS[role]) {
      if (!validPerms.has(perm)) {
        throw new Error(
          `[config] Invalid permission "${perm}" in ROLE_PERMISSIONS.${role}`,
        );
      }
    }
  }
}
_validateMatrix();

// ─────────────────────────────────────────────────────────────────
// Organization enums
// ─────────────────────────────────────────────────────────────────

export const INDUSTRIES = [
  'BANKING',
  'GOVERNMENT',
  'HEALTHCARE',
  'OIL_GAS',
  'EDUCATION',
  'TELECOM',
  'RETAIL',
  'MANUFACTURING',
  'INSURANCE',
  'REAL_ESTATE',
  'LOGISTICS',
  'OTHER',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const INDUSTRY_LABELS_AR: Record<Industry, string> = {
  BANKING: 'البنوك والخدمات المالية',
  GOVERNMENT: 'القطاع الحكومي',
  HEALTHCARE: 'الرعاية الصحية',
  OIL_GAS: 'النفط والغاز',
  EDUCATION: 'التعليم',
  TELECOM: 'الاتصالات',
  RETAIL: 'تجارة التجزئة',
  MANUFACTURING: 'التصنيع',
  INSURANCE: 'التأمين',
  REAL_ESTATE: 'العقارات',
  LOGISTICS: 'الخدمات اللوجستية',
  OTHER: 'أخرى',
};

export const COMPANY_SIZES = [
  'SIZE_1_10',
  'SIZE_11_50',
  'SIZE_51_200',
  'SIZE_201_500',
  'SIZE_501_1000',
  'SIZE_1001_5000',
  'SIZE_5001_PLUS',
] as const;

export type CompanySize = (typeof COMPANY_SIZES)[number];

export const COMPANY_SIZE_LABELS_AR: Record<CompanySize, string> = {
  SIZE_1_10: '1 - 10 موظفين',
  SIZE_11_50: '11 - 50 موظف',
  SIZE_51_200: '51 - 200 موظف',
  SIZE_201_500: '201 - 500 موظف',
  SIZE_501_1000: '501 - 1,000 موظف',
  SIZE_1001_5000: '1,001 - 5,000 موظف',
  SIZE_5001_PLUS: '5,001+ موظف',
};

export const DEPLOYMENT_MODES = [
  'CLOUD',
  'HYBRID',
  'AIR_GAPPED',
] as const;

export type DeploymentMode = (typeof DEPLOYMENT_MODES)[number];

export const DEPLOYMENT_MODE_LABELS_AR: Record<DeploymentMode, string> = {
  CLOUD: 'سحابي (BrightAI managed)',
  HYBRID: 'هجين (بياناتك عندك + AI عندنا)',
  AIR_GAPPED: 'معزول بالكامل (on-premise)',
};

export const COMPLIANCE_FRAMEWORKS = [
  'PDPL',
  'NCA_ECC',
  'SDAIA_AI_ETHICS',
  'SFDA',
  'SAMA',
  'ZATCA',
  'ISO_27001',
  'ISO_42001',
  'ISO_13485',
] as const;

export type ComplianceFramework = (typeof COMPLIANCE_FRAMEWORKS)[number];

export const COMPLIANCE_LABELS_AR: Record<ComplianceFramework, string> = {
  PDPL: 'نظام حماية البيانات الشخصية',
  NCA_ECC: 'ضوابط الأمن السيبراني الأساسية (NCA)',
  SDAIA_AI_ETHICS: 'أخلاقيات الذكاء الاصطناعي - سدايا',
  SFDA: 'هيئة الغذاء والدواء',
  SAMA: 'البنك المركزي السعودي',
  ZATCA: 'هيئة الزكاة والضريبة والجمارك',
  ISO_27001: 'ISO 27001 - أمن المعلومات',
  ISO_42001: 'ISO 42001 - حوكمة الذكاء الاصطناعي',
  ISO_13485: 'ISO 13485 - أجهزة طبية',
};

// ─────────────────────────────────────────────────────────────────
// Member status
// ─────────────────────────────────────────────────────────────────

export const MEMBER_STATUSES = [
  'INVITED', // invite sent, not yet accepted
  'ACTIVE', // accepted + signed in
  'DEACTIVATED', // soft-deleted (preserves audit trail)
  'REMOVED', // hard-removed (only by OWNER)
] as const;

export type MemberStatus = (typeof MEMBER_STATUSES)[number];

// ─────────────────────────────────────────────────────────────────
// Audit log actions
// ─────────────────────────────────────────────────────────────────

export const AUDIT_ACTIONS = [
  'USER_LOGIN',
  'USER_LOGIN_FAILED',
  'USER_LOGOUT',
  'USER_INVITED',
  'USER_INVITE_ACCEPTED',
  'USER_INVITE_REVOKED',
  'USER_ROLE_CHANGED',
  'USER_DEACTIVATED',
  'USER_REACTIVATED',
  'USER_REMOVED',
  'ORG_CREATED',
  'ORG_UPDATED',
  'ORG_DELETED',
  'MEMBERSHIP_CREATED',
  'MEMBERSHIP_UPDATED',
  'MEMBERSHIP_DELETED',
  'POLICY_CREATED',
  'POLICY_UPDATED',
  'POLICY_DELETED',
  'POLICY_APPROVED',
  'REQUEST_CREATED',
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'EMAIL_VERIFIED',
  'TWO_FA_ENABLED',
  'TWO_FA_DISABLED',
  'TWO_FA_FAILED',
  'PASSKEY_REGISTERED',
  'PASSKEY_REMOVED',
  'SUPPORT_IMPERSONATION_STARTED',
  'SUPPORT_IMPERSONATION_ENDED',
  'API_KEY_CREATED',
  'API_KEY_REVOKED',
  'INTEGRATION_CONNECTED',
  'INTEGRATION_DISCONNECTED',
  'DATA_EXPORT_REQUESTED',
  'DATA_DELETION_REQUESTED',
  'DATA_DELETION_COMPLETED',
  'FEATURE_FLAG_TOGGLED',
  // SSO-001 (2026-07-15): Enterprise SSO events (SAML 2.0 / OIDC).
  'SSO_CONNECTION_CONFIGURED',
  'SSO_CONNECTION_TESTED',
  'SSO_CONNECTION_DISABLED',
  'SSO_LOGIN_SUCCESS',
  'SSO_LOGIN_FAILED',
  'SSO_JIT_PROVISIONED',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// ─────────────────────────────────────────────────────────────────
// Onboarding
// ─────────────────────────────────────────────────────────────────

export const ONBOARDING_STEPS = [
  'ORG_INFO', // name, size, industry, CR
  'COMPLIANCE_PROFILE', // frameworks selection
  'TEAM_INVITES', // invite first team members
  'DEPLOYMENT_MODE', // cloud/hybrid/air-gapped
  'FIRST_INTEGRATION', // SharePoint/Slack/Teams/Custom
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STEP_LABELS_AR: Record<OnboardingStep, string> = {
  ORG_INFO: 'معلومات المنظمة',
  COMPLIANCE_PROFILE: 'ملف الامتثال',
  TEAM_INVITES: 'دعوة الفريق',
  DEPLOYMENT_MODE: 'نشر النظام',
  FIRST_INTEGRATION: 'أول تكامل',
};

// ─────────────────────────────────────────────────────────────────
// Integration connectors
// ─────────────────────────────────────────────────────────────────

export const INTEGRATION_CONNECTORS = [
  'SHAREPOINT',
  'SLACK',
  'TEAMS',
  'EMAIL',
  'WEBHOOK',
  'CUSTOM_API',
] as const;

export type IntegrationConnector = (typeof INTEGRATION_CONNECTORS)[number];

// ─────────────────────────────────────────────────────────────────
// Rate limits (mirrored in packages/db/policies/rls.sql comments)
// ─────────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: { limit: 5, windowSeconds: 15 * 60 },
  SIGNUP_ATTEMPTS: { limit: 3, windowSeconds: 60 * 60 },
  PASSWORD_RESET: { limit: 3, windowSeconds: 60 * 60 },
  INVITE_SEND: { limit: 10, windowSeconds: 60 * 60 },
  TWO_FA_VERIFY: { limit: 5, windowSeconds: 5 * 60 },
  API_REQUESTS: { limit: 1000, windowSeconds: 60 * 60 },
} as const;

// ─────────────────────────────────────────────────────────────────
// Invitation lifecycle
// ─────────────────────────────────────────────────────────────────

export const INVITATION_TTL_HOURS = 24;

// ─────────────────────────────────────────────────────────────────
// Session limits
// ─────────────────────────────────────────────────────────────────

export const SESSION_LIMITS = {
  ABSOLUTE_MAX_AGE_DAYS: 30,
  IDLE_TIMEOUT_HOURS: 12,
  MAX_CONCURRENT_DEVICES: 5,
} as const;

// ─────────────────────────────────────────────────────────────────
// Chat session context (CHAT-SESSION-2026-07-15)
// Shared between the marketing site's /api/ai/chat/ and any future
// consumer that wants the same multi-turn context behaviour. Currently
// the only consumer is the kernel AI assistant (5 kernel pages + chat.astro)
// but the constants live here so the dashboard can adopt the same shape
// without a parallel definition.
// ─────────────────────────────────────────────────────────────────

export const CHAT_SESSION_LIMITS = {
  /** Max messages kept in the per-session LIST (8 = 4 user + 4 assistant
   *  turns, or 8 single-side messages). The kernel prompts ask for
   *  multi-turn context within a 5-turn demo, so 8 gives 3 turns of
   *  buffer for partial-match / off-by-one edge cases. */
  MAX_MESSAGES: 8,

  /** TTL on the per-session Redis key. 10 minutes matches the kernel
   *  AI assistant's "stay on the same page" UX: a returning visitor
   *  who pauses for 15 minutes gets a fresh conversation, which is the
   *  safer default (avoids surfacing stale context to a new topic). */
  TTL_SECONDS: 600,

  /** Hard cap on sessionId length to bound key size in Redis. A
   *  canonical UUID (with dashes) is 36 chars; we allow 64 for any
   *  future client-side scheme that wants prefix + UUID. */
  SESSION_ID_MAX_CHARS: 64,

  /** Hard cap on each message's content length when reading from the
   *  store. The /api/ai/chat/ endpoint already enforces 4000 chars on
   *  incoming user messages; this is the symmetric cap for stored
   *  content to defend against malformed Redis entries. */
  STORED_MESSAGE_MAX_CHARS: 4000,
} as const;

// ─────────────────────────────────────────────────────────────────
// Password policy
// ─────────────────────────────────────────────────────────────────

export const PASSWORD_POLICY = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_DIGIT: true,
  REQUIRE_SYMBOL: true,
  MIN_STRENGTH_ENTROPY: 60, // bits, zxcvbn score ≥ 3
} as const;