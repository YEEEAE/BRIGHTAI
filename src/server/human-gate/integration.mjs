import { randomUUID } from 'node:crypto';
import { audit } from '../kernel/service.mjs';
import { recordKernelAuditEvidence } from '../ledger/writer.mjs';

export function lockHumanGate(db, tenantId) {
  return db.query("SELECT pg_advisory_xact_lock(hashtextextended('human-gate:' || $1,0))", [tenantId]);
}

export async function recordIntegratedReviewCreation(db, identity, tenantId, requestId, policyVersion) {
  const auditId = await audit(db,identity,tenantId,`human_gate.request.created:${requestId}`,{
    correlationId:requestId,policyVersion,idempotencyKey:`human-gate:${requestId}:CREATED`,
  });
  await db.query("INSERT INTO public.aigas_hg_events(id,tenant_id,request_id,requester_id,actor_user_id,event_type,audit_id) VALUES($1,$2,$3,$4,$4,'CREATED',$5)",[randomUUID(),tenantId,requestId,identity.userId,auditId]);
  await recordKernelAuditEvidence(db,identity,tenantId,{
    auditId,correlationId:requestId,policyVersion,action:'kernel.human_gate.request.created',
  });
}
