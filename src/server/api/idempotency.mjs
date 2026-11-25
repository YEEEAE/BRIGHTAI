import { createHash } from 'node:crypto';
import { KernelError } from '../kernel/core.mjs';
import { idempotencyKeySchema } from './schemas.mjs';

export function checkIdempotencyKey(key) {
  if (key !== null && !idempotencyKeySchema.safeParse(key).success) {
    throw new KernelError(400, 'INVALID_IDEMPOTENCY_KEY', 'مفتاح منع التكرار غير صالح.');
  }
}

// Call after validation and authorization, inside the same transaction as the
// write and its audit records. The result stores a resource reference only.
export async function lockIdempotentCreate(db, { identity, tenantId, operation, key, input }) {
  checkIdempotencyKey(key);
  if (key === null) return null;
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const lock = JSON.stringify([tenantId, identity.userId, operation, key]);
  const scope = [tenantId, identity.userId, operation, key];
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended('command:' || $1, 0))", [lock]);
  const previous = (await db.query(
    'SELECT request_fingerprint,resource_id FROM public.aigas_command_idempotency WHERE tenant_id=$1 AND actor_id=$2 AND operation=$3 AND request_key=$4',
    scope,
  )).rows[0];
  if (previous && previous.request_fingerprint !== fingerprint) {
    throw new KernelError(409, 'IDEMPOTENCY_CONFLICT', 'المفتاح مستخدم لطلب مختلف.');
  }
  return {
    resourceId: previous?.resource_id ?? null,
    save: resourceId => db.query(
      'INSERT INTO public.aigas_command_idempotency(tenant_id,actor_id,operation,request_key,request_fingerprint,resource_id) VALUES($1,$2,$3,$4,$5,$6)',
      [...scope, fingerprint, resourceId],
    ),
  };
}
