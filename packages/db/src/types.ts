/**
 * @brightai/db — Re-exports of generated Prisma types.
 *
 * Consumers should import types from here rather than directly from
 * @prisma/client — this lets us add custom branded types or wrappers
 * without breaking the API surface.
 */

export type {
  Organization,
  User,
  Membership,
  Invitation,
  Passkey,
  TwoFactorBackupCode,
  Session,
  OrganizationCompliance,
  Policy,
  AIRequest,
  Integration,
  ApiKey,
  AuditLog,
  Domain,
  OnboardingProgress,
  DataExportRequest,
  DataDeletionRequest,
  LeadQueue,
  Subscription,
} from '@prisma/client';

// `LeadQueueStatus` is a runtime enum — Prisma does not emit a separate
// type alias. Re-export the enum only.
export {
  Role,
  Industry,
  CompanySize,
  DeploymentMode,
  ComplianceFramework,
  MemberStatus,
  AuditAction,
  OnboardingStep,
  IntegrationConnector,
  PolicyStatus,
  PolicyCategory,
  RequestStatus,
  RequestRiskLevel,
  IntegrationStatus,
  ApiKeyStatus,
  DomainStatus,
  DataRequestStatus,
  ActorType,
  SubscriptionStatus,
  BillingPlan,
  Prisma,
} from '@prisma/client';

// `LeadQueueStatus` is generated as a runtime enum that doubles as a
// type alias. Re-export the enum under its original name, then derive
// a type-only alias so consumers can use `LeadQueueStatus` as either a
// value or a type without touching `@prisma/client` directly.
import { LeadQueueStatus as _LeadQueueStatusEnum } from '@prisma/client';
export const LeadQueueStatus = _LeadQueueStatusEnum;
export type LeadQueueStatus = (typeof _LeadQueueStatusEnum)[keyof typeof _LeadQueueStatusEnum];

// Re-export the `PrismaClient` class type so consumers (e.g. the
// dashboard's audit durable helpers) can type their transaction
// callbacks without importing directly from `@prisma/client`. Keeping
// the import surface narrow — just the class, not the runtime —
// avoids accidental coupling to the generated client path.
export type { PrismaClient } from '@prisma/client';