// Server/CLI only: a privileged operator connection, never the browser request pool.
import { randomUUID } from 'node:crypto';
import { KernelError, isUuid, workspaceName } from './core.mjs';
import { EXPLORATION_CAPABILITIES } from './exploration.mjs';

async function operator(db, userId) {
 if(!isUuid(userId))throw new KernelError(403,'OPERATOR_REQUIRED','يلزم مشغل معتمد.');
 const row=(await db.query(`SELECT o.user_id FROM public.aigas_trial_operators o
 JOIN neon_auth."user" u ON u.id=o.user_id WHERE o.user_id=$1 AND o.status='ACTIVE' AND u.banned IS NOT TRUE FOR SHARE OF o,u`,[userId])).rows[0];
 if(!row)throw new KernelError(403,'OPERATOR_REQUIRED','يلزم مشغل معتمد.');
}
async function transact(pool, work) {
 const db=await pool.connect();
 try {await db.query('BEGIN');const result=await work(db);await db.query('COMMIT');return result;}
 catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
async function event(db, actor, tenant, action) {
 const id=randomUUID();
 const written=await db.query('INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action) VALUES($1,$2,$3,$4) RETURNING id',[id,tenant,actor,action]);
 const evidence=await db.query('SELECT id FROM public.aigas_audit_events WHERE id=$1 AND tenant_id=$2 AND actor_user_id=$3 AND action=$4',[id,tenant,actor,action]);
 if(written.rowCount!==1||evidence.rowCount!==1)throw new Error('EVIDENCE_UNAVAILABLE');
}
export async function bootstrapExploration(pool, actor, input) {
 const name=workspaceName(input.name);
 const {ownerId, memberIds=[], approvalReference, limitUnits}=input;
 if(!isUuid(ownerId)||!Array.isArray(memberIds)||memberIds.length>30||memberIds.some(id=>!isUuid(id))||memberIds.includes(ownerId)||new Set(memberIds).size!==memberIds.length
 ||typeof approvalReference!=='string'||approvalReference.trim().length<10||approvalReference.length>180
 ||!Number.isInteger(limitUnits)||limitUnits<1||limitUnits>10000)throw new KernelError(400,'INVALID_BOOTSTRAP','حدد أعضاء وحصة ومرجع اعتماد صالحين.');
 return transact(pool,async db=>{
  await operator(db,actor);
  await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[ownerId]);
  const users=(await db.query('SELECT id FROM neon_auth."user" WHERE id=ANY($1::uuid[]) AND banned IS NOT TRUE FOR SHARE',[[ownerId,...memberIds]])).rows;
  if(users.length!==memberIds.length+1)throw new KernelError(403,'IDENTITY_REQUIRED','يلزم حساب نشط لكل عضو؛ لم تُرسل دعوات.');
  const owned=(await db.query("SELECT count(*)::int AS n FROM public.aigas_memberships WHERE user_id=$1 AND role='OWNER'",[ownerId])).rows[0].n;
  if(owned>=3)throw new KernelError(409,'WORKSPACE_LIMIT','بلغ المالك حد المؤسسات.');
  const tenantId=randomUUID();
  await db.query('INSERT INTO public.aigas_tenants(id,name) VALUES($1,$2)',[tenantId,name]);
  await db.query("INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'OWNER')",[tenantId,ownerId]);
  for(const member of memberIds)await db.query("INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'MEMBER')",[tenantId,member]);
  await db.query(`INSERT INTO public.aigas_product_access(tenant_id,product_slug) SELECT $1,unnest($2::text[])`,[tenantId,Object.keys(EXPLORATION_CAPABILITIES)]);
  await db.query(`INSERT INTO public.aigas_exploration_grants(tenant_id,product_slug,starts_at,ends_at,limit_units,approved_by,approval_reference)
 SELECT $1,unnest($2::text[]),now(),now()+interval '48 hours',$3,$4,$5`,[tenantId,Object.keys(EXPLORATION_CAPABILITIES),limitUnits,actor,approvalReference]);
  const owners=(await db.query("SELECT user_id FROM public.aigas_memberships WHERE tenant_id=$1 AND role='OWNER'",[tenantId])).rows;
  if(owners.length!==1||owners[0].user_id!==ownerId)throw new Error('BOOTSTRAP_OWNER_CONFLICT');
  await event(db,actor,tenantId,'operator.exploration.bootstrapped');
  return {tenantId,source:'INTERNAL_EXPLORATION_48H',capabilities:EXPLORATION_CAPABILITIES,readiness:'NOT_ASSERTED',syntheticOnly:true};
 });
}
export async function closeExploration(pool,actor,tenantId) {
 if(!isUuid(tenantId))throw new Error('INVALID_WORKSPACE');
 return transact(pool,async db=>{
  await operator(db,actor);
  const rows=(await db.query('UPDATE public.aigas_exploration_grants SET revoked_at=COALESCE(revoked_at,now()) WHERE tenant_id=$1 RETURNING product_slug',[tenantId])).rows;
  if(!rows.length)throw new Error('EXPLORATION_NOT_FOUND');
  await event(db,actor,tenantId,'operator.exploration.closed');
  return {tenantId,revoked:true,sessionsRevoked:false,sessionAction:'Use the Auth operator channel; membership and grant checks apply immediately.'};
 });
}
export async function exportExploration(pool,actor,tenantId) {
 if(!isUuid(tenantId))throw new Error('INVALID_WORKSPACE');
 return transact(pool,async db=>{
  await operator(db,actor);
  const grants=(await db.query('SELECT product_slug,starts_at,ends_at,limit_units,used,revoked_at FROM public.aigas_exploration_grants WHERE tenant_id=$1',[tenantId])).rows;
  const events=(await db.query("SELECT action,created_at FROM public.aigas_audit_events WHERE tenant_id=$1 AND (action LIKE 'exploration.%' OR action LIKE 'operator.exploration.%') ORDER BY created_at,id",[tenantId])).rows;
  return {tenantId,grants,events,contentIncluded:false,purge:{dryRun:true,eligible:false,reason:'RETENTION_APPROVAL_REQUIRED',plannedGrantRows:grants.length,deleteExecuted:false}};
 });
}
