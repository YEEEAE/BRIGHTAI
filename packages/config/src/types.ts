/**
 * @brightai/config — Shared TypeScript types.
 */

export type {
  Role,
  Permission,
  Industry,
  CompanySize,
  DeploymentMode,
  ComplianceFramework,
  MemberStatus,
  AuditAction,
  OnboardingStep,
  IntegrationConnector,
} from './constants';

export {
  ROLES,
  INDUSTRIES,
  COMPANY_SIZES,
  DEPLOYMENT_MODES,
  COMPLIANCE_FRAMEWORKS,
  MEMBER_STATUSES,
  AUDIT_ACTIONS,
  ONBOARDING_STEPS,
  INTEGRATION_CONNECTORS,
} from './constants';

export type { Env, ServerEnv, PublicEnv } from './env';
export { parseEnv, parseEnvSplit, REQUIRED_DASHBOARD_ENV } from './env';
export {
  ForbiddenError,
  hasPermission,
  requirePermission,
  requireRoleAtLeast,
  getRolePermissions,
} from './rbac';

export {
  ROLE_LABELS_AR,
  ROLE_DESCRIPTIONS_AR,
  INDUSTRY_LABELS_AR,
  COMPANY_SIZE_LABELS_AR,
  DEPLOYMENT_MODE_LABELS_AR,
  COMPLIANCE_LABELS_AR,
  ONBOARDING_STEP_LABELS_AR,
  ROLE_RANK,
  ROLE_PERMISSIONS,
  RATE_LIMITS,
  INVITATION_TTL_HOURS,
  SESSION_LIMITS,
  PASSWORD_POLICY,
} from './constants';