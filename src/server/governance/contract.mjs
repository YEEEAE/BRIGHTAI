import { z } from 'zod';

const reference = z.string().regex(/^[a-z][a-z0-9.-]{0,63}$/);
const description = z.string().trim().min(3).max(500);
const version = z.number().int().positive().max(999999);
export const assetKinds = ['SYSTEM', 'MODEL', 'AGENT', 'USE_CASE', 'VENDOR'];
export const states = ['Pass', 'Fail', 'Needs Evidence', 'Needs Review', 'N/A'];
export const products = ['kernel', 'firewall', 'risk-engine', 'human-gate', 'ledger'];
export const axes = ['inventory', 'enforcement', 'risk', 'oversight', 'traceability'];
export const actionModes = ['ALLOW', 'DENY', 'ESCALATE'];

export const assetSchema = z.strictObject({
  synthetic: z.literal(true),
  id: reference,
  kind: z.enum(assetKinds),
  version,
  owner: reference,
  purpose: description,
  dataSource: z.strictObject({ kind: z.literal('SYNTHETIC'), reference }),
  limits: z.array(z.strictObject({ tool: reference, action: reference, mode: z.enum(actionModes) })).max(50),
  review: z.strictObject({ reviewer: reference, dueOn: z.iso.date() }),
}).superRefine((asset, ctx) => {
  if (asset.review.reviewer === asset.owner) ctx.addIssue({ code: 'custom', message: 'Independent reviewer required' });
  const pairs = asset.limits.map(limit => `${limit.tool}:${limit.action}`);
  if (new Set(pairs).size !== pairs.length) ctx.addIssue({ code: 'custom', message: 'Duplicate tool/action' });
});

export const packSchema = z.strictObject({
  synthetic: z.literal(true),
  id: reference,
  version,
  effectiveOn: z.iso.date(),
  source: z.discriminatedUnion('type', [
    z.strictObject({ type: z.literal('INTERNAL'), reference }),
    z.strictObject({ type: z.literal('OFFICIAL_REFERENCE'), reference,
      url: z.url().refine(value => {
        const url = new URL(value);
        return url.protocol === 'https:' && ['dgp.sdaia.gov.sa', 'www.nist.gov'].includes(url.hostname) && !url.username && !url.password;
      }),
      documentVersion: z.string().trim().min(1).max(100),
      accessedOn: z.iso.date(),
      status: z.literal('REFERENCE_NOT_APPROVED'),
    }),
  ]),
  appliesTo: z.array(z.enum(assetKinds)).min(1).refine(items => new Set(items).size === items.length),
  requirements: z.array(z.strictObject({
    id: reference,
    control: reference,
    check: z.strictObject({ id: reference, procedure: description }),
    expectedEvidence: z.strictObject({ kind: reference, description }),
    owner: reference,
    axis: z.enum(axes),
    product: z.enum(products),
    severity: z.enum(['P0', 'STANDARD']),
    critical: z.boolean(),
    appliesTo: z.array(z.enum(assetKinds)).min(1).refine(items => new Set(items).size === items.length),
    requirement: description,
  })).min(1).max(100),
}).superRefine((pack, ctx) => {
  const ids = pack.requirements.map(item => item.id);
  const checks = pack.requirements.map(item => item.check.id);
  if (new Set(ids).size !== ids.length || new Set(checks).size !== checks.length) {
    ctx.addIssue({ code: 'custom', message: 'Duplicate requirement or check id' });
  }
  if (pack.requirements.some(item => item.appliesTo.some(kind => !pack.appliesTo.includes(kind)))) {
    ctx.addIssue({ code: 'custom', message: 'Requirement applicability exceeds pack scope' });
  }
});

export const evidenceSchema = z.strictObject({
  synthetic: z.literal(true),
  reference,
  kind: reference,
  summary: description,
});
export const reviewSchema = z.strictObject({
  reviewer: reference,
  outcome: z.enum(['Pass', 'Fail', 'Needs Evidence']),
  reason: description,
});
