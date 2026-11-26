import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { adminScope } from '../kernel/administration.mjs';
import { audit } from '../kernel/service.mjs';
import { KernelError } from '../kernel/core.mjs';

import { registryMutationSchema } from './persistent-contract.mjs';

export async function registryOperation(identity, workspace, input = { operation: 'list' }) {
  const body = input.operation === 'list' ? input : registryMutationSchema.safeParse(input);
  if (input.operation !== 'list' && !body.success) throw new KernelError(400,'INVALID_REGISTRY_ENTRY','بيانات السجل غير صالحة.');
  const op = input.operation === 'list' ? input : body.data;
  return transaction(async db => {
    const scope = await adminScope(db, identity, workspace, op.operation === 'list' ? ['OWNER','ADMIN','MEMBER'] : ['OWNER','ADMIN']);
    const tenantId = scope.tenant.tenant_id;
    if (op.operation === 'list') {
      const rows = (await db.query(`SELECT e.id,e.version,e.kind,e.name,e.owner_id,e.mandate,e.product_slug,e.capabilities,e.source_reference,e.links,e.created_by,e.created_at,
        CASE WHEN r.decision IS NOT NULL THEN 'REVOKED' WHEN a.decision IS NULL THEN 'DRAFT' WHEN a.expires_at <= clock_timestamp() THEN 'EXPIRED' ELSE 'APPROVED' END AS status,
        a.actor_id AS approved_by,a.expires_at,r.actor_id AS revoked_by
        FROM public.aigas_registry_entries e
        LEFT JOIN public.aigas_registry_decisions a ON (a.tenant_id,a.entry_id,a.version,a.decision)=(e.tenant_id,e.id,e.version,'APPROVED')
        LEFT JOIN public.aigas_registry_decisions r ON (r.tenant_id,r.entry_id,r.version,r.decision)=(e.tenant_id,e.id,e.version,'REVOKED')
        WHERE e.tenant_id=$1 AND e.version=(SELECT max(v.version) FROM public.aigas_registry_entries v WHERE v.tenant_id=e.tenant_id AND v.id=e.id)
        ORDER BY e.created_at DESC,e.id LIMIT 100`,[tenantId])).rows;
      return { entries: rows };
    }
    const id = op.id ?? randomUUID();
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [`registry:${tenantId}:${id}`]);
    const latest = (await db.query('SELECT * FROM public.aigas_registry_entries WHERE tenant_id=$1 AND id=$2 ORDER BY version DESC LIMIT 1',[tenantId,id])).rows[0];
    if (op.operation === 'create' || op.operation === 'revise') {
      if (op.operation === 'revise' && (!latest || latest.version !== op.expectedVersion)) throw new KernelError(409,'REGISTRY_VERSION_CONFLICT','تغيرت نسخة السجل.');
      const e = op.entry;
      if (latest && latest.kind !== e.kind) throw new KernelError(409,'REGISTRY_KIND_IMMUTABLE','لا يمكن تغيير نوع السجل.');
      const member = (await db.query('SELECT 1 FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2',[tenantId,e.ownerId])).rowCount;
      if (!member) throw new KernelError(400,'REGISTRY_OWNER_INVALID','يجب أن يكون المالك عضوًا في المؤسسة.');
      const version = latest ? latest.version + 1 : 1;
      await db.query(`INSERT INTO public.aigas_registry_entries (tenant_id,id,version,kind,name,owner_id,mandate,product_slug,capabilities,source_reference,links,created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11::jsonb,$12)`,[tenantId,id,version,e.kind,e.name,e.ownerId,e.mandate,e.productSlug,JSON.stringify(e.capabilities),e.sourceReference,JSON.stringify(e.links),identity.userId]);
      await audit(db,identity,tenantId,'kernel.registry.revised',{correlationId:randomUUID()});
      return { persisted:true,id,version,status:'DRAFT' };
    }
    if (!latest || latest.version !== op.version) throw new KernelError(409,'REGISTRY_VERSION_CONFLICT','تغيرت نسخة السجل.');
    if (scope.tenant.role !== 'OWNER') throw new KernelError(403,'FORBIDDEN','يلزم مالك المؤسسة لاعتماد السجل أو إلغائه.');
    const decisions = (await db.query('SELECT decision,expires_at FROM public.aigas_registry_decisions WHERE tenant_id=$1 AND entry_id=$2 AND version=$3',[tenantId,id,op.version])).rows;
    if (op.operation === 'approve') {
      if (latest.created_by === identity.userId || latest.owner_id === identity.userId) throw new KernelError(403,'SEPARATION_OF_DUTIES','يلزم معتمد مستقل عن المنشئ والمالك.');
      if (decisions.length) throw new KernelError(409,'REGISTRY_DECISION_EXISTS','سُجل قرار لهذه النسخة.');
      if (Date.parse(op.expiresAt) <= Date.now()) throw new KernelError(400,'REGISTRY_EXPIRY_INVALID','يجب أن يكون انتهاء الاعتماد في المستقبل.');
    } else if (!decisions.some(d => d.decision === 'APPROVED') || decisions.some(d => d.decision === 'REVOKED')) throw new KernelError(409,'REGISTRY_REVOCATION_INVALID','لا يوجد اعتماد قابل للإلغاء.');
    const decision = op.operation === 'approve' ? 'APPROVED' : 'REVOKED';
    await db.query('INSERT INTO public.aigas_registry_decisions(tenant_id,entry_id,version,decision,actor_id,expires_at,reason) VALUES($1,$2,$3,$4,$5,$6,$7)',[tenantId,id,op.version,decision,identity.userId,op.expiresAt ?? null,op.reason]);
    await audit(db,identity,tenantId,`kernel.registry.${op.operation}`,{correlationId:randomUUID()});
    return { persisted:true,id,version:op.version,status:decision };
  });
}
