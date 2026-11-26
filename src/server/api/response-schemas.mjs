import { z } from 'zod';
import { dependencyStatusSchema, routeIdSchema as id } from './schemas.mjs';

const record = z.record(z.string(), z.json());
const rows = z.array(record);
const instant = z.iso.datetime({ offset: true });
const message = z.string().min(1);
const version = z.number().int().positive();
const page = z.object({ page: version, hasMore: z.boolean() });
const persisted = z.object({ persisted: z.literal(true) });
const trial = persisted.extend({ trialId: id, state: z.string(), version });
const release = { version: z.string().nullable(), commit: z.string().regex(/^[a-f0-9]{40}$/).nullable() };
const success = z.strictObject({ success: z.literal(true) });
const authSignIn = z.union([z.object({ user: record }), z.strictObject({ twoFactorRedirect: z.literal(true) })]);
const firewallDashboard = z.object({ rules: rows.max(25), decisions: rows.max(12), page: version, hasNext: z.boolean(), tenant: record });
const policyHistory = z.strictObject({
  policyId: id,
  versions: z.array(z.strictObject({
    version, status: z.string(), conditions: record, effect: z.string(), obligations: z.array(z.string()),
    is_mandatory: z.boolean(), required_approvals: version, effective_from: instant.nullable(),
    expires_at: instant.nullable(), checksum: z.string(), change_reason: z.string(), created_by: id,
    approved_by: id.nullable(), created_at: instant, published_at: instant.nullable(),
  })).max(50),
  approvals: z.array(z.strictObject({
    version, action: z.string(), actor_user_id: id, reason: z.string(), created_at: instant,
  })).max(50),
  versionsPage: version.max(999), approvalsPage: version.max(999),
  hasMoreVersions: z.boolean(), hasMoreApprovals: z.boolean(),
});
const authInvitation = z.object({ invitation: record });

export const responseSchemas = {
  'GET /healthz': z.strictObject({ ...release, status: z.literal('ok') }),
  'GET /readyz': z.strictObject({
    ...release, schema: z.literal(1), status: z.literal('ready'), state: z.literal('ready'), checkedAt: instant,
    dependencies: z.strictObject({ database: z.string(), auth: z.string(), authProbe: z.string(), portal: z.string() }),
    release: record.nullable(), service: record.nullable(), error: z.null(),
  }),
  'GET /api/enterprise-inquiry': z.strictObject({ available: z.boolean() }),
  'POST /api/enterprise-inquiry': z.strictObject({ status: z.literal('received'), submissionId: z.uuidv4() }),
  'GET /api/trial-availability': z.strictObject({ available: z.boolean() }),
  'GET /api/measurement-status': z.strictObject({ enabled: z.boolean() }),
  'POST /api/observability': z.undefined(),
  'POST /api/security/csp-report': z.undefined(),
  'POST /api/public-demo/groq-sandbox': z.never(),
  'GET /auth/api/get-session': z.object({ user: record, session: record }).nullable(),
  'GET /auth/api/token': z.object({ token: z.string().min(1) }),
  'GET /auth/api/organization/list': rows,
  'GET /auth/api/organization/list-invitations': rows,
  'POST /auth/api/sign-up/email': success,
  'POST /auth/api/sign-in/email': authSignIn,
  'POST /auth/api/sign-in/email-otp': authSignIn,
  'POST /auth/api/sign-out': success,
  'POST /auth/api/email-otp/send-verification-otp': success,
  'POST /auth/api/email-otp/verify-email': z.object({ status: z.boolean(), user: record }),
  'POST /auth/api/organization/accept-invitation': authInvitation,
  'POST /auth/api/organization/cancel-invitation': z.object({ id: z.string(), status: z.string() }),
  'POST /auth/api/organization/invite-member': z.object({ id: z.string(), status: z.string() }),
  'POST /auth/api/organization/create': z.object({ id: z.string(), name: z.string(), slug: z.string() }),
  'POST /app/api/agents/runs': z.object({
    run_id: id, tenant_id: id, status: z.string(), agent_key: z.string(),
    agent_version: z.string(), policy_version: z.string(), correlation_id: id.nullable(),
    handoff: record.nullable(), expires_at: z.iso.datetime().nullable(), created_at: z.iso.datetime().nullable(), replayed: z.boolean(),
  }),
  'GET /app/api/agents/runs/[runId]': z.object({
    run_id: id, tenant_id: id, status: z.string(), agent_key: z.string(),
    agent_version: z.string(), policy_version: z.string(), correlation_id: id.nullable(),
    handoff: record.nullable(), expires_at: z.iso.datetime().nullable(), created_at: z.iso.datetime().nullable(),
    steps: z.number().int().nonnegative(), outbox: z.array(z.object({ event_id: z.string(), event_type: z.string(), status: z.string(), attempts: z.number().int().nonnegative() })),
  }),
  'POST /app/api/agents/runs/[runId]/step': z.object({
    status: z.string(), step_id: id, step_no: version, reason: z.string().optional(),
    approval_fingerprint: z.string().optional(), tool: record.nullable().optional(),
    invocation_id: id.nullable().optional(), handoff: record.nullable(),
  }),
  'POST /app/api/agents/runs/[runId]/resume': z.object({ status: z.literal('RUNNING'), step_no: version, handoff: record.nullable() }),
  'POST /app/api/agents/runs/[runId]/cancel': z.object({ status: z.literal('CANCELLED'), run_id: id, reason: z.string() }),
  'POST /app/api/agents/runs/[runId]/retry': z.object({ dispatched: version, failed: version, dead: version, remaining: version }),
  'POST /app/api/agents/orchestrations': z.object({
    status: z.string(), correlation_id: id, runs: z.array(z.object({ run_id: id.nullable(), agent_key: z.string(), product: z.string(), status: z.string(), reason: z.string().optional(), handoff: record.nullable().optional(), correlation_id: id })),
  }),
  'GET /app/api/kernel': z.object({ tenant: record.nullable(), memberships: rows, products: rows, activity: rows, connection: z.literal('CONNECTED') }),
  'POST /app/api/kernel': persisted.extend({ tenantId: id, refreshRequired: z.literal(true).optional() }),
  'GET /app/api/kernel/health': z.object({ status: z.string(), state: z.string(), checks: record, configuration: record }),
  'GET /app/api/kernel/invitations': z.object({ available: z.boolean(), invitations: rows }),
  'GET /app/api/kernel/members': page.extend({ tenant: record, memberships: rows, canManage: z.boolean(), members: rows.max(100), invitation: record }),
  'POST /app/api/kernel/pilot-report': z.strictObject({ report: record, sha256: z.string().regex(/^[a-f0-9]{64}$/), receipt: id }),
  'POST /app/api/kernel/members': persisted,
  'PATCH /app/api/kernel/products': persisted.extend({ status: z.string(), version }),
  'GET /app/api/kernel/policies': z.union([z.object({ policies: rows, departments: rows }), policyHistory]),
  'POST /app/api/kernel/policies': z.union([
    z.object({ policies: rows, departments: rows }), policyHistory,
    z.object({ policyId: id, status: z.string(), version }), z.object({ departmentId: id, status: z.string() }),
    z.object({ userId: id, status: z.string(), action: z.literal('APPROVE') }),
  ]),
  'GET /app/api/kernel/trials': z.object({ configured: z.boolean(), lifecycle: record.nullable(), activationClosed: z.literal(true) }),
  'POST /app/api/kernel/trials': trial,
  'POST /app/api/kernel/trials/[trialId]/submit': trial,
  'POST /app/api/kernel/trials/[trialId]/cancel': trial,
  'GET /app/api/operator/trials': page.extend({ operator: z.literal(true), activation: z.string(), trials: rows.max(100) }),
  'POST /app/api/operator/trials/[trialId]/activate': trial,
  'POST /app/api/operator/trials/[trialId]/close': trial,
  'POST /app/api/operator/trials/[trialId]/decide': trial,
  'POST /app/api/operator/trials/[trialId]/expire': trial,
  'GET /app/api/trial': z.object({ tenantId: id.nullable(), status: z.string(), remainingSeconds: z.number().int().nonnegative(), products: rows }),
  'POST /app/api/trial': z.union([z.strictObject({ tenantId: id }), z.strictObject({ href: z.string().startsWith('/app/') })]),
  'GET /app/api/firewall/rules': firewallDashboard,
  'POST /app/api/firewall/rules': firewallDashboard,
  'PATCH /app/api/firewall/rules': firewallDashboard,
  'DELETE /app/api/firewall/rules': firewallDashboard,
  'POST /app/api/firewall/evaluate': persisted.extend({ action: z.string(), external_action_executed: z.literal(false) }),
  'POST /app/api/firewall/guarded-executions': persisted.extend({ decision: record, code: z.string().optional(), execution_status: z.string(), external_action_executed: z.boolean().nullable() }),
  'GET /app/api/human-gate/delegations': persisted.extend({ delegations: rows.max(100), canManage: z.boolean() }),
  'POST /app/api/human-gate/delegations': persisted.extend({ delegation: record }),
  'POST /app/api/human-gate/delegations/[delegationId]/revoke': persisted.extend({ delegation: record }),
  'POST /app/api/human-gate/policy': persisted.extend({ policy: record }),
  'GET /app/api/human-gate/requests': page.extend({ requests: rows.max(25), tenant: record }),
  'POST /app/api/human-gate/requests': persisted.extend({ request: record }),
  'POST /app/api/human-gate/requests/[requestId]/cancel': persisted.extend({ request: record }),
  'POST /app/api/human-gate/requests/[requestId]/decide': persisted.extend({ request: record, decision: record }),
  'POST /app/api/human-gate/requests/[requestId]/execute': persisted.extend({ request: record, permit: record }),
  'GET /app/api/ledger/events': page.extend({ events: rows.max(25), chain: record }),
  'POST /app/api/ledger/events': persisted.extend({ event: record, replayed: z.boolean() }),
  'GET /app/api/ledger/events/[eventId]': z.object({ event: record, chain: record, state: z.string() }),
  'GET /app/api/ledger/events/[eventId]/export': z.object({ format: z.string(), manifest: record, entries: rows.max(10000), verification: record }),
  'POST /app/api/ledger/events/[eventId]/verify': z.object({ result: z.string(), state: z.string(), mismatch: z.boolean(), reasons: z.array(z.string()) }),
  'GET /app/api/risk-engine/actions': page.extend({ actions: rows.max(25) }),
  'GET /app/api/risk-engine/assets': page.extend({ assets: rows.max(25), filteredTotal: z.number().int().nonnegative() }),
  'POST /app/api/risk-engine/assets': persisted.extend({ asset: record }),
  'PATCH /app/api/risk-engine/assets/[assetId]': persisted.extend({ asset: record, changed: z.boolean() }),
  'DELETE /app/api/risk-engine/assets/[assetId]': persisted.extend({ asset: record, changed: z.boolean() }),
  'GET /app/api/risk-engine/assets/[assetId]/assessments': page.extend({ asset: record, assessments: rows.max(25) }),
  'POST /app/api/risk-engine/assets/[assetId]/assessments': persisted.extend({ assessment: record }),
  'GET /app/api/risk-engine/assets/[assetId]/revisions': page.extend({ asset: record, revisions: rows.max(25) }),
  'GET /app/api/risk-engine/assets/[assetId]/treatments': page.extend({ asset: record, treatments: rows.max(25) }),
  'POST /app/api/risk-engine/assets/[assetId]/treatments': persisted.extend({ treatment: record }),
  'PATCH /app/api/risk-engine/assets/[assetId]/treatments': persisted.extend({ treatment: record }),
  'GET /app/api/risk-engine/export': z.object({ schema_version: z.literal('risk-register-v2'), tenant_id: id, assets: rows.max(10000) }),
  'POST /app/api/risk-engine/assist': z.strictObject({
    draft: z.strictObject(Object.fromEntries(['scenarios', 'suggestedControls', 'reviewQuestions'].map(key => [key, z.array(z.string().min(2).max(100)).min(1).max(3)]))),
    advisory_only: z.literal(true),
  }),
  'GET /app/api/secure-chat/models': z.object({ models: rows, available: z.boolean(), dependencyStatus: dependencyStatusSchema, message }),
  'POST /app/api/secure-chat/messages': z.strictObject({
    requestId: id, reply: z.string(), submittedText: z.string(), modelId: z.string(), usage: record,
    redacted: z.boolean(), saved: z.literal(false), contentStored: z.literal(false), message,
  }),
  'DELETE /app/api/secure-chat/messages': z.strictObject({
    requestId: id, state: z.enum(['ALREADY_FINISHED', 'CANCEL_PENDING']),
    cancellationRecorded: z.boolean(), meteringPending: z.boolean(), message,
  }),
};
