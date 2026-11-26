import { z } from 'zod';
import { routeIdSchema } from './schemas.mjs';
import { actions, templates, MAX_TEXT_LENGTH } from '../firewall/core.mjs';
import { classifications, treatmentStatuses } from '../risk-engine/core.mjs';
import { syntheticTypes } from '../ledger/core.mjs';
import { operations, reviewLevels, riskReviewOperation } from '../human-gate/core.mjs';
import { resolveRoute } from './routes.mjs';
import { registryMutationSchema } from '../governance/persistent-contract.mjs';

const id = routeIdSchema;
const text = (min, max) => z.string().refine(value => {
  const length = value.trim().length;
  return length >= min && length <= max;
});
const product = z.enum(['firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat']);
const reason = text(10, 1000);
const empty = z.strictObject({});
const email = z.email().max(254);
export const enterpriseInquirySchema = z.strictObject({
  submissionId: z.uuidv4(), email, message: z.string().trim().min(1).max(2000),
});
const password = z.string().min(1).max(256);
const otp = z.string().regex(/^\d{4,10}$/);
const callbackURL = z.string().max(2048).optional();
const invitation = z.strictObject({ invitationId: text(1, 128) });

export const authBodySchemas = {
  'sign-up/email': z.strictObject({ email, password, name: text(1, 100), callbackURL }),
  'sign-in/email': z.strictObject({ email, password, rememberMe: z.boolean().optional(), callbackURL }),
  'sign-in/email-otp': z.strictObject({ email, otp }),
  'sign-out': empty,
  'email-otp/send-verification-otp': z.strictObject({ email, type: z.enum(['sign-in', 'email-verification']) }),
  'email-otp/verify-email': z.strictObject({ email, otp }),
  'organization/accept-invitation': invitation,
  'organization/cancel-invitation': invitation,
  'organization/invite-member': z.strictObject({ email, role: z.literal('member'), organizationId: text(1, 128) }),
  'organization/create': z.strictObject({ name: text(2, 100), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(128) }),
};

const version = z.number().int().positive();
const duration = z.number().int().min(1).max(1440);
const shortReason = text(2, 500);
const reviewOperation = z.enum(['KERNEL_WORKSPACE_RENAME', 'INTERNAL_DEMO_NOTE']);
const ruleFields = { name: text(2, 60), pattern: text(1, 80), action: z.enum(actions), priority: z.number().int().min(1).max(999).nullish() };
const toolValue = z.string().regex(/^[a-z][a-z0-9:.-]{0,79}$/);
const toolCall = z.strictObject({ tool: toolValue, action: toolValue, resource: toolValue, capability: toolValue, version });
const ruleInput = z.strictObject({ text: z.string().min(1).max(MAX_TEXT_LENGTH).refine(value => Boolean(value.trim())), synthetic: z.boolean() });

const assetInput = z.strictObject({
  name: text(2, 120), owner: text(2, 120), purpose: shortReason,
  data_classification: z.enum(classifications), lifecycle_status: z.enum(['ACTIVE', 'RETIRED']).nullish(),
  data_context: z.string().max(500).nullish(), provider_reference: z.string().max(120).nullish(),
  model_reference: z.string().max(120).nullish(), model_version: z.string().max(120).nullish(),
  approval_status: z.string().max(120).nullish(), synthetic_data_confirmed: z.boolean(),
});
const axis = z.number().int().min(1).max(3);
const optionalAxis = z.union([axis, z.enum(['', '1', '2', '3'])]).nullish();
const treatment = z.strictObject({
  asset_version: version, assessment_id: id, treatment_version: z.number().int().nonnegative(), owner: text(2, 120),
  status: z.enum(treatmentStatuses), control_description: shortReason, residual_risk_description: shortReason,
  review_on: z.union([z.iso.date(), z.literal('')]).nullish(), rationale: shortReason,
  residual_likelihood: optionalAxis, residual_impact: optionalAxis, synthetic_data_confirmed: z.boolean(),
});
const policyText = text(3, 500);
const dateTime = z.string().max(64).refine(value => Number.isFinite(Date.parse(value)));
const condition = text(1, 120).optional();
const definition = z.strictObject({
  scope: z.enum(['ENTERPRISE', 'DEPARTMENT', 'PRODUCT', 'USER']),
  departmentId: id.nullish(), productSlug: product.nullish(), userId: id.nullish(),
  family: text(1, 120), ruleKey: text(1, 120),
  conditions: z.strictObject({ operation: condition, resource_type: condition, data_classification: condition, provider: condition, model: condition, region: condition }).optional(),
  effect: z.enum(['ALLOW', 'BLOCK', 'HARD_DENY', 'REDACT', 'REQUEST_APPROVAL', 'WARN']),
  obligations: z.array(z.enum(['REDACT', 'REQUEST_APPROVAL', 'WARN'])).optional(),
  mandatory: z.boolean().optional(), requiredApprovals: z.number().int().min(1).max(2).optional(),
  effectiveFrom: dateTime.nullish(), expiresAt: dateTime.nullish(), reason: policyText,
});
const policyOperation = z.discriminatedUnion('operation', [
  z.strictObject({ operation: z.literal('list') }),
  z.strictObject({ operation: z.literal('history'), policyId: id, versionsPage: z.number().int().min(1).max(999).optional(), approvalsPage: z.number().int().min(1).max(999).optional() }),
  z.strictObject({ operation: z.literal('create'), definition }),
  z.strictObject({ operation: z.literal('revise'), definition, policyId: id, expectedVersion: z.number().int().nonnegative() }),
  z.strictObject({ operation: z.literal('department-create'), name: text(2, 100), reason: policyText }),
  z.strictObject({ operation: z.enum(['department-member-add', 'department-member-remove']), departmentId: id, userId: id, reason: policyText }),
  z.strictObject({ operation: z.literal('delegate-approver'), userId: id, expiresAt: dateTime, reason: policyText }),
  z.strictObject({ operation: z.literal('revoke-approver'), userId: id, reason: policyText }),
  z.strictObject({ operation: z.enum(['submit', 'approve', 'withdraw', 'retire']), policyId: id, version, reason: policyText.optional() }),
  z.strictObject({ operation: z.literal('publish'), policyId: id, version, expectedVersion: z.number().int().nonnegative(), reason: policyText.optional() }),
]);


const agentKey = z.string().regex(/^[a-z][a-z0-9-]{1,63}$/);
const agentObjective = text(3, 500);
const agentIdem = z.string().regex(/^[A-Za-z0-9_.:-]{1,128}$/);
const agentCorrelation = z.uuidv4();
const agentToolMessage = z.strictObject({
  tool: z.string().regex(/^[a-z][a-z0-9_-]{1,63}$/),
  action: z.string().regex(/^[a-z][a-z0-9:.-]{0,79}$/),
  resource: z.string().regex(/^[a-z][a-z0-9:.-]{0,79}$/),
  capability: z.string().regex(/^[a-z][a-z0-9:.-]{0,79}$/),
  version: z.number().int().positive().max(1000),
  arguments: z.record(z.string().max(64), z.json()).optional(),
});
const agentStart = z.strictObject({
  agentKey, objective: agentObjective, synthetic: z.literal(true), correlationId: agentCorrelation,
  idempotencyKey: agentIdem, parentRunId: id.nullish(), parentStepId: id.nullish(),
  deadlineMs: z.number().int().min(1000).max(900000).optional(), handoff: z.record(z.string(), z.json()).nullish(),
});
const agentStep = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('TOOL'), message: agentToolMessage, note: text(3, 200).nullish(), correlationId: agentCorrelation, idempotencyKey: agentIdem }),
  z.strictObject({ kind: z.enum(['PLAN','POLICY','RESULT','HUMAN_GATE']), note: text(3, 200).nullish(), correlationId: agentCorrelation, idempotencyKey: agentIdem }),
]);
const agentPlan = z.strictObject({
  plan: z.array(z.strictObject({ agentKey, objective: agentObjective, messages: z.array(agentToolMessage).max(4).optional() })).min(1).max(5),
  correlationId: agentCorrelation, idempotencyKey: agentIdem,
  deadlineMs: z.number().int().min(1000).max(900000).optional(),
});

const methodSchemas = {
  'POST /api/enterprise-inquiry': enterpriseInquirySchema,
  'POST /app/api/kernel/policies': policyOperation,
  'POST /app/api/kernel/registry': registryMutationSchema,
  'POST /app/api/firewall/evaluate': ruleInput.or(z.strictObject({ tool_call: toolCall, synthetic: z.boolean() })),
  'POST /app/api/firewall/agent': z.strictObject({ text: z.string().min(1).max(800).refine(value => Boolean(value.trim())), synthetic: z.literal(true), correlationId: agentCorrelation, idempotencyKey: agentIdem.max(100) }),
  'POST /app/api/firewall/guarded-executions': ruleInput.extend({ request_id: id, department_id: id.nullish() }).or(
    z.strictObject({ tool_call: toolCall, synthetic: z.boolean(), request_id: id, department_id: id.nullish() })),
  'POST /app/api/firewall/rules': z.union([
    z.strictObject({ template: z.enum(Object.keys(templates)) }),
    z.strictObject({ duplicate_of: id }),
    z.strictObject(ruleFields),
  ]),
  'PATCH /app/api/firewall/rules': z.strictObject(ruleFields).partial().extend({ id, version, enabled: z.boolean().optional() }),
  'DELETE /app/api/firewall/rules': z.strictObject({ id, version }),
  'POST /app/api/human-gate/requests': z.strictObject({
    title: text(2, 120), description: shortReason, reason: shortReason, operation_type: reviewOperation,
    new_name: z.string().max(100).nullish(), synthetic_confirmed: z.boolean(),
  }),
  'POST /app/api/human-gate/requests/[requestId]/decide': z.strictObject({ decision: z.enum(['APPROVE', 'REJECT']), reason: shortReason }),
  'POST /app/api/human-gate/requests/[requestId]/execute': empty,
  'POST /app/api/human-gate/requests/[requestId]/cancel': z.strictObject({ reason: shortReason }),
  'POST /app/api/human-gate/policy': z.strictObject({
    version: id.nullable(), pending_minutes: duration, approval_minutes: duration, enabled: z.boolean(),
    review_level: z.enum(reviewLevels).optional(), separation_of_duties: z.boolean().optional(), delegation_enabled: z.boolean().optional(),
  }),
  'POST /app/api/human-gate/delegations': z.strictObject({ delegatee_id: id, operation_type: z.enum(operations.filter(operation => operation !== riskReviewOperation)), level: z.enum(reviewLevels), minutes: duration, reason: shortReason }),
  'POST /app/api/human-gate/delegations/[delegationId]/revoke': z.strictObject({ reason: shortReason }),
  'POST /app/api/ledger/events': z.strictObject({ event_type: z.enum(syntheticTypes), scenario: z.enum(['integrity-check', 'access-check']), idempotency_key: id }),
  'POST /app/api/ledger/events/[eventId]/verify': z.strictObject({ candidate: z.strictObject({
    event_id: id, source: text(1, 120), event_type: text(1, 120), policy_version: text(1, 120),
    metadata_json: z.record(z.string().max(120), z.json()), created_at: dateTime, created_by: id.nullable(),
    hash_profile: text(1, 120), sequence_no: z.union([z.string().regex(/^[1-9]\d{0,18}$/), version]),
    previous_hash: z.string().regex(/^[a-f0-9]{64}$/).nullable(), idempotency_key: text(1, 180),
  }).optional() }),
  'POST /app/api/risk-engine/assets': assetInput,
  'PATCH /app/api/risk-engine/assets/[assetId]': assetInput.extend({ asset_version: version }),
  'DELETE /app/api/risk-engine/assets/[assetId]': z.strictObject({ asset_version: version, reason: shortReason, synthetic_data_confirmed: z.boolean() }),
  'POST /app/api/risk-engine/assets/[assetId]/assessments': z.strictObject({
    asset_version: version, likelihood: axis, impact: axis, likelihood_reason: shortReason, impact_reason: shortReason,
    controls_reason: shortReason, evidence_references: z.string().max(1000).nullish(), synthetic_data_confirmed: z.boolean(),
  }),
  'POST /app/api/risk-engine/assets/[assetId]/treatments': treatment,
  'PATCH /app/api/risk-engine/assets/[assetId]/treatments': treatment,
  'POST /app/api/risk-engine/assist': z.strictObject({ purpose: shortReason, data_classification: z.enum(classifications), synthetic: z.boolean(), asset_id:id.optional(), asset_version:version.optional() }),
  'POST /app/api/agents/runs': agentStart,
  'POST /app/api/agents/orchestrations': agentPlan,
  'POST /app/api/agents/runs/[runId]/step': agentStep,
  'POST /app/api/agents/runs/[runId]/resume': z.strictObject({ approvalRef: id, correlationId: agentCorrelation, idempotencyKey: agentIdem }),
  'POST /app/api/agents/runs/[runId]/cancel': z.strictObject({ reason: z.string().regex(/^[A-Z][A-Z0-9_]{1,79}$/), correlationId: agentCorrelation, idempotencyKey: agentIdem }),
  'POST /app/api/agents/runs/[runId]/retry': z.strictObject({ correlationId: agentCorrelation, idempotencyKey: agentIdem }),
  'POST /app/api/kernel': z.strictObject({ name: text(2, 100) }),
  'PATCH /app/api/kernel/products': z.strictObject({ slug: product, status: z.enum(['FOUNDATION', 'ENABLED', 'DISABLED']), version: z.number().int().positive() }),
  'POST /app/api/kernel/pilot-report': z.strictObject({ from: z.iso.datetime(), until: z.iso.datetime() }),
  'POST /app/api/kernel/members': z.discriminatedUnion('operation', [
    z.strictObject({ operation: z.literal('set-role'), userId: id, role: z.enum(['ADMIN', 'MEMBER']) }),
    z.strictObject({ operation: z.literal('revoke'), userId: id }),
    z.strictObject({ operation: z.enum(['accept', 'cancel', 'register']), invitationId: id }),
    z.strictObject({ operation: z.literal('link'), organizationId: id }),
  ]),
  'POST /app/api/kernel/trials': z.strictObject({
    products: z.array(product).min(1).max(5).refine(values => new Set(values).size === values.length),
    deploymentMode: z.enum(['SAAS', 'ON_PREMISE', 'AIR_GAPPED']),
    businessGoal: text(20, 1000),
    dataMode: z.literal('SYNTHETIC').nullish(),
  }),
  'POST /app/api/kernel/trials/[trialId]/submit': empty,
  'POST /app/api/kernel/trials/[trialId]/cancel': z.strictObject({ reason }),
  'POST /app/api/operator/trials/[trialId]/activate': z.strictObject({ customerAcknowledged: z.boolean().optional() }),
  'POST /app/api/operator/trials/[trialId]/close': z.strictObject({ reason: reason.nullish() }),
  'POST /app/api/operator/trials/[trialId]/decide': z.discriminatedUnion('decision', [
    z.strictObject({ decision: z.literal('APPROVE'), reason: z.string().max(1000).optional() }),
    z.strictObject({ decision: z.literal('REJECT'), reason }),
  ]),
  'POST /app/api/operator/trials/[trialId]/expire': empty,
  'POST /app/api/trial': z.discriminatedUnion('operation', [
    z.strictObject({ operation: z.literal('start') }),
    z.strictObject({ operation: z.literal('open'), product }),
  ]),
  'POST /app/api/secure-chat/messages': z.strictObject({
    requestId: id, modelId: z.string().min(1).max(120), message: z.string().min(1).max(48000),
    history: z.array(z.strictObject({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(32000) })).max(12).nullish(),
    syntheticAcknowledged: z.boolean(),
  }),
  'DELETE /app/api/secure-chat/messages': z.strictObject({ requestId: id }),
};

export function bodySchemaFor(request) {
  const path = new URL(request.url).pathname;
  let decoded;
  try { decoded = decodeURI(path).replace(/\/{2,}/g, '/'); } catch { return undefined; }
  const route = resolveRoute(decoded)?.route;
  return route && methodSchemas[`${request.method} ${route.path}`];
}

export const observabilityBodySchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('login_flow_result'), section: z.string().max(64),
    status_code: z.union([z.literal(200), z.number().int().min(400).max(599)]),
  }),
  z.strictObject({ kind: z.enum(['client_error', 'client_rejection']), section: z.string().max(64) }),
]);

export const cspReportBodySchema = z.strictObject({ 'csp-report': z.strictObject({
  'effective-directive': z.string().max(64),
  'violated-directive': z.string().max(64).optional(),
  'document-uri': z.string().max(4096).optional(),
  'blocked-uri': z.string().max(4096).optional(),
  'source-file': z.string().max(4096).optional(),
  referrer: z.string().max(4096).optional(),
  'original-policy': z.string().max(8192).optional(),
  'script-sample': z.string().max(256).optional(),
  disposition: z.enum(['enforce', 'report']).optional(),
  'status-code': z.number().int().min(0).max(599).optional(),
  'line-number': z.number().int().nonnegative().optional(),
  'column-number': z.number().int().nonnegative().optional(),
}) });
