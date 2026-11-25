import { z } from 'zod';
import { dependencyClasses } from '../kernel/contracts.mjs';

export const requestIdSchema = z.uuidv4();
export const dependencyStatusSchema = z.enum(Object.values(dependencyClasses)).nullable();
export const errorSchema = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,79}$/),
  message: z.string().min(1).max(800),
  dependencyStatus: dependencyStatusSchema,
  requestId: requestIdSchema,
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
