import { requireProductAccess } from '../kernel/access.mjs';
import { randomUUID } from 'node:crypto';
import { transaction } from '../kernel/db.mjs';
import { tenantGuard, audit } from '../kernel/service.mjs';
import { KernelError, requireRole } from '../kernel/core.mjs';
import { exactObject, filters, hashEvent, profile, types, uuid, verifyEvent } from './core.mjs';

const columns = 'event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,integrity_hash';
export function createLedgerService(transact = transaction) {
  return async (identity, requested, operation, body = {}, params = new URLSearchParams(), id) => {
    if (!['list','create','detail','verify','export'].includes(operation)) throw new KernelError(404,'NOT_FOUND','المسار غير موجود.');
    const filter = filters(params);
    exactObject(body, operation === 'create' ? ['event_type','scenario'] : operation === 'verify' ? ['candidate'] : []);
    if (['detail','verify','export'].includes(operation) && !uuid(id)) throw new KernelError(400,'INVALID_ID','معرّف الحدث غير صالح.');
    return transact(async db => {
      const scope = await tenantGuard(identity, requested, db);
      if (!scope.tenant) throw new KernelError(403,'NO_WORKSPACE','أنشئ مساحة عمل من Kernel أولًا.');
      const tenantId = scope.tenant.tenant_id;
   await requireProductAccess(db, identity, tenantId, 'ledger');
      // Hold membership until commit, including concurrent role changes/revocation.
      const member = (await db.query('SELECT role FROM public.aigas_memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE', [tenantId, identity.userId])).rows[0];
      requireRole(member, operation === 'create' || operation === 'export' ? ['OWNER','ADMIN'] : ['OWNER','ADMIN','MEMBER']);
      const permissions = { create: ['OWNER','ADMIN'].includes(member.role), export: ['OWNER','ADMIN'].includes(member.role) };
      if (operation === 'create') {
        if (!types.includes(body.event_type) || !['integrity-check','access-check'].includes(body.scenario)) throw new KernelError(400,'INVALID_EVENT','اختر نوعًا وسيناريو اصطناعيًا معتمدًا.');
        const event = { event_id: randomUUID(), tenant_id: tenantId, source: 'ledger.synthetic-lab', event_type: body.event_type, policy_version: 'foundation-v1', metadata_json: { synthetic:true, scenario:body.scenario, outcome:body.event_type === types[0] ? 'RECORDED' : 'REVIEWED', decision_ref:randomUUID() }, created_at:new Date().toISOString(), created_by:identity.userId };
        event.integrity_hash = hashEvent(event);
        await db.query(`INSERT INTO public.aigas_ld_events (${columns}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [event.event_id, tenantId, event.source, event.event_type, event.policy_version, event.metadata_json, event.created_at, event.created_by, event.integrity_hash]);
        await audit(db, identity, tenantId, 'ledger.synthetic.created');
        return { event, profile, persisted:true };
      }
      if (operation === 'list') {
        const result = await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 AND ($2='' OR event_type=$2) AND ($3::int IS NULL OR created_at >= now()-make_interval(days => $3::int)) AND ($4='' OR position(lower($4) in lower(event_id::text))>0 OR position(lower($4) in lower(metadata_json->>'decision_ref'))>0) ORDER BY created_at DESC,event_id DESC LIMIT 26 OFFSET $5`, [tenantId, filter.type, filter.days, filter.search, (filter.page-1)*25]);
        return { tenant:{...scope.tenant,role:member.role}, memberships:scope.memberships, permissions, events:result.rows.slice(0,25), page:filter.page, hasMore:result.rows.length>25 && filter.page<100 };
      }
      const event = (await db.query(`SELECT ${columns} FROM public.aigas_ld_events WHERE tenant_id=$1 AND event_id=$2`, [tenantId,id])).rows[0];
      if (!event) throw new KernelError(404,'NOT_FOUND','الحدث غير موجود ضمن مؤسستك.');
      if (operation === 'verify') return { result:verifyEvent(event, body.candidate), profile, independentSignature:false };
      if (operation === 'export') {
        await audit(db, identity, tenantId, 'ledger.event.exported');
        return { profile, event, verification:verifyEvent(event), limitations:'Initial SHA-256 consistency check only. No independent signature, external anchor, legal proof or database administrator tamper prevention.' };
      }
      return { event, profile, permissions };
    });
  };
}
export const operate = createLedgerService();
