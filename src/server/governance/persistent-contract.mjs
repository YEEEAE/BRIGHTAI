import { z } from 'zod';

const ref = z.string().trim().min(3).max(255).regex(/^[\w.:/\-]+$/);
const details = z.strictObject({
  kind: z.enum(['ASSET','MODEL','TOOL','VENDOR','GOVERNING_AGENT','THIRD_PARTY_AGENT','POLICY_PACK']),
  name: z.string().trim().min(2).max(120), ownerId: z.uuid(), mandate: z.string().trim().min(3).max(500),
  productSlug: z.enum(['kernel','firewall','risk-engine','human-gate','ledger','secure-chat']),
  capabilities: z.array(ref).max(30), sourceReference: ref,
  links: z.array(z.strictObject({ requirement: ref, control: ref, finding: ref, evidence: ref })).max(30),
});
export const registryMutationSchema = z.discriminatedUnion('operation', [
  z.strictObject({ operation: z.literal('create'), entry: details }),
  z.strictObject({ operation: z.literal('revise'), id: z.uuid(), expectedVersion: z.number().int().positive(), entry: details }),
  z.strictObject({ operation: z.literal('approve'), id: z.uuid(), version: z.number().int().positive(), expiresAt: z.iso.datetime({ offset: true }), reason: z.string().trim().min(3).max(500) }),
  z.strictObject({ operation: z.literal('revoke'), id: z.uuid(), version: z.number().int().positive(), reason: z.string().trim().min(3).max(500) }),
]);

