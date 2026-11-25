import { z } from 'zod';
import { dependencyClasses } from '../kernel/contracts.mjs';

export const requestIdSchema = z.uuidv4();
export const dependencyStatusSchema = z.enum(Object.values(dependencyClasses)).nullable();
const policyCode = z.string().regex(/^[A-Z][A-Z0-9_]{0,79}$/);
const policyVersion = z.string().regex(/^[a-zA-Z0-9_.:-]{1,120}$/);
const ruleVersion = z.number().int().positive().nullable();

const firewallErrorDecision = z.object({
  id: z.uuid(),
  action: z.enum(['ALLOW', 'WARN', 'REDACT', 'ESCALATE', 'DENY']),
  reason: policyCode,
  reason_text: z.string().min(1).max(500),
  rule_id: z.uuid().nullable(),
  rule_version: ruleVersion,
  matcher_id: z.string().regex(/^[a-z][a-z0-9-]{1,63}$/).nullable(),
  matcher_version: ruleVersion,
  rule_name: z.string().max(120).nullable(),
  warning_held: z.boolean(),
  created_at: z.iso.datetime(),
  mode: z.literal('GUARD'),
  policy_version: policyVersion,
  request_fingerprint: z.string().regex(/^[0-9a-f]{64}$/),
});
export const firewallErrorEvidence = z.object({
  decision: firewallErrorDecision,
  request_id: z.uuid(),
  policy_version: policyVersion,
  execution_status: policyCode,
  external_action_executed: z.boolean().nullable(),
  review_required: z.boolean().optional(),
  blocked_reason: policyCode.optional(),
});

export const errorSchema = z.strictObject({
  code: policyCode,
  message: z.string().min(1).max(800),
  dependencyStatus: dependencyStatusSchema,
  requestId: requestIdSchema,
  ...firewallErrorEvidence.partial().shape,
});

export const routeIdSchema = z.string().regex(/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);
export const pageSchema = z.string().regex(/^[1-9]\d{0,4}$/);

const shortFilter = z.string().max(120);
export const workspaceQuery = { workspace: routeIdSchema.optional() };
export const ledgerQuery = { page: pageSchema, type: shortFilter, source: shortFilter, classification: shortFilter, period: shortFilter, q: shortFilter };
export const firewallQuery = { page: pageSchema, action: shortFilter, reason: shortFilter, mode: shortFilter, from: shortFilter, to: shortFilter };
export const humanGateQuery = { page: pageSchema, status: shortFilter, view: shortFilter, request: routeIdSchema };
export const riskQuery = { page: pageSchema, q: shortFilter, classification: shortFilter, risk_level: shortFilter, assessment_status: shortFilter, treatment_status: shortFilter, due: z.enum(['0', '1']) };

export function queryMatches(params, shape) {
  const values = Object.create(null);
  for (const [key, value] of params) {
    if (Object.hasOwn(values, key) || !Object.hasOwn(shape, key)) return false;
    values[key] = value;
  }
  return z.strictObject(shape).partial().safeParse(values).success;
}

export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9_.:-]{1,128}$/);
