import { localDatabaseUrl, installSchema, grantProduct, runtime } from './helpers/database.mjs';
// Disposable localhost PostgreSQL only; never loads .env or changes Neon.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { createHumanGateService } from '../src/server/human-gate/service.mjs';
import { createHandler } from '../src/server/human-gate/http.mjs';
const url=localDatabaseUrl('HUMAN_GATE_TEST_DATABASE_URL');
test('Human Gate: durable decisions, independent reviewer, isolation, concurrency, enforced effect, audit rollback',{skip:!url},async()=>{
 const pool=new pg.Pool({connectionString:url,max:5});
 try{
 await installSchema(pool);
    const owner={userId:randomUUID()},reviewer={userId:randomUUID()},member={userId:randomUUID()},outsider={userId:randomUUID()},tenant=randomUUID(),other=randomUUID();
 for(const user of [owner,reviewer,member,outsider])await pool.query('INSERT INTO neon_auth."user"(id) VALUES($1)',[user.userId]);
 await pool.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B')",[tenant,other]);
 for(const [u,t,role] of [[owner,tenant,'OWNER'],[reviewer,tenant,'ADMIN'],[member,tenant,'MEMBER'],[outsider,other,'OWNER']])await pool.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)',[t,u.userId,role]);
 await grantProduct(pool,tenant,'human-gate'); await grantProduct(pool,other,'human-gate');
 const transact=async work=>{const c=await pool.connect();try{await c.query('BEGIN');await runtime(c);const result=await work(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK'); throw e;}finally{c.release();}};
 const service=createHumanGateService(transact);
 const send=async(user,op='list',body={},id,scope=tenant,status='PENDING')=>{
  const handler=createHandler(async()=>user,service),method=op==='list'?'GET':'POST';
  const response=await handler(new Request(`https://local/app/api/human-gate/requests/?workspace=${scope}&status=${status}&view=${user===owner||user===member?'mine':'review'}`,{method,headers:{origin:'https://local','content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})}),op,id);
  const data=await response.json();return {status:response.status,data};
 };
 assert.equal((await send(owner,'policy',{version:null,pending_minutes:60,approval_minutes:30,enabled:true})).status,200);
 const input={title:'Synthetic note',description:'Synthetic description',reason:'Synthetic reason',operation_type:'INTERNAL_DEMO_NOTE',synthetic_confirmed:true};
 const create=async(user=owner)=>{const r=await send(user,'create',input);assert.equal(r.status,201);assert.equal(r.data.request.status,'PENDING');assert.equal(r.data.request.completed_at,null);return r.data.request.id;};
 const id=await create();
 assert.equal((await send(owner)).data.requests[0].id,id);
 assert.equal((await send(owner)).data.requests[0].canDecide,false);
 assert.equal((await send(reviewer)).data.requests[0].canDecide,true);
 assert.equal((await send(owner,'execute',{},id)).status,409);
 assert.equal((await send(owner,'decide',{decision:'APPROVE',reason:'Self attempt'},id)).status,403);
 assert.equal((await send(owner,'decide',{decision:'REJECT',reason:'Self attempt'},id)).status,403);
 assert.equal((await send(member,'decide',{decision:'APPROVE',reason:'Not authorized'},id)).status,404);
 assert.equal((await send(outsider,'list',{},undefined,tenant)).status,403);
 assert.equal((await send(outsider,'list',{},undefined,other)).data.requests.length,0);
 for(const op of ['decide','execute'])assert.equal((await send(outsider,op,op==='decide'?{decision:'APPROVE',reason:'Other tenant'}:{},id,other)).status,404);
 for(const field of ['tenant_id','requester_id','status','completed_at','reviewer_id'])assert.equal((await send(owner,'create',{...input,[field]:'forged'})).status,400);
 assert.equal((await send(owner,'create',{...input,operation_type:'SEND_EMAIL'})).status,400);
 assert.equal((await send(reviewer,'decide',{decision:'APPROVE',reason:''},id)).status,400);
 assert.equal((await send(reviewer,'decide',{decision:'APPROVE',reason:'Independent review'},id)).status,200);
 const loaded=await send(owner,'list',{},undefined,tenant,'APPROVED');assert.equal(loaded.data.requests[0].decision_reason,'Independent review');assert.equal(loaded.data.requests[0].reviewer_id,reviewer.userId);assert.equal(loaded.data.requests[0].completed_at,null);
 assert.equal((await send(reviewer,'execute',{},id)).status,403);
 assert.equal((await send(reviewer,'decide',{decision:'REJECT',reason:'Cannot replace'},id)).status,409);
 assert.equal((await send(owner,'execute',{request_id:randomUUID()},id)).status,400);
 const execute=await send(owner,'execute',{},id);assert.equal(execute.status,200);assert.ok(execute.data.request.completed_at);
 const replay=await send(owner,'execute',{},id);assert.equal(replay.status,409);assert.equal(replay.data.code,'ALREADY_EXECUTED');
 assert.equal(Number((await pool.query("SELECT count(*) AS n FROM aigas_audit_events WHERE action=$1",[`human_gate.request.executed:${id}`])).rows[0].n),1);
 const rejected=await create();assert.equal((await send(reviewer,'decide',{decision:'REJECT',reason:'Rejected synthetic note'},rejected)).status,200);assert.equal((await send(owner,'execute',{},rejected)).status,409);
 assert.equal((await send(owner,'list',{},undefined,tenant,'REJECTED')).data.requests[0].completed_at,null);
 // Two separate DB connections contend on the same row, not an in-memory fake.
 const race=await create(member);
 const decisions=await Promise.all([send(owner,'decide',{decision:'APPROVE',reason:'First decision'},race),send(reviewer,'decide',{decision:'REJECT',reason:'Second decision'},race)]);
 assert.deepEqual(decisions.map(r=>r.status).sort(),[200,409]);
 assert.equal(Number((await pool.query('SELECT count(*) AS n FROM aigas_hg_decisions WHERE request_id=$1',[race])).rows[0].n),1);
 // Ledger is installed without an access grant: basic auditing stays independent.
 assert.ok((await pool.query("SELECT id FROM aigas_audit_events WHERE action LIKE 'human_gate.decision.%'")).rowCount);
 await pool.query("UPDATE aigas_memberships SET role='MEMBER' WHERE tenant_id=$1 AND user_id=$2",[tenant,reviewer.userId]);
 const pending=await create();assert.equal((await send(reviewer,'decide',{decision:'APPROVE',reason:'Revoked role'},pending)).status,404);
 await pool.query("UPDATE aigas_memberships SET role='ADMIN' WHERE tenant_id=$1 AND user_id=$2",[tenant,reviewer.userId]);
 // Real Kernel effect: two independent transactions compete for the same permit.
 const rename=async(name)=>{
  const result=await send(owner,'create',{...input,operation_type:'KERNEL_WORKSPACE_RENAME',new_name:name});
  assert.equal(result.status,201,JSON.stringify(result.data));
  return result.data.request.id;
 };
 const approve=async requestId=>assert.equal((await send(reviewer,'decide',{decision:'APPROVE',reason:'Independent synthetic approval'},requestId)).status,200);
 const renameId=await rename('Synthetic renamed');
 await approve(renameId);
 const executions=await Promise.all([send(owner,'execute',{},renameId),send(owner,'execute',{},renameId)]);
 assert.deepEqual(executions.map(r=>r.status).sort(),[200,409]);
 const readback=(await pool.query(`SELECT t.name,t.profile_version,r.status,r.payload,r.execution_result,
   d.decision,d.reason,d.reviewer_id,d.payload_digest AS decision_digest,d.policy_version AS decision_policy,
   r.payload_digest,r.policy_version,g.status AS grant_status,g.consumed_by,
   (SELECT count(*)::int FROM aigas_hg_events e WHERE e.request_id=r.id AND e.event_type='EXECUTED') AS executed_events,
   (SELECT count(*)::int FROM aigas_audit_events a WHERE a.action='human_gate.request.executed:'||r.id::text) AS executed_audits
   FROM aigas_hg_requests r JOIN aigas_tenants t ON t.id=r.tenant_id
   JOIN aigas_hg_decisions d ON d.request_id=r.id JOIN aigas_hg_grants g ON g.request_id=r.id WHERE r.id=$1`,[renameId])).rows[0];
 assert.equal(readback.name,'Synthetic renamed');assert.equal(readback.status,'EXECUTED');
 assert.equal(readback.payload.new_name,readback.name);assert.equal(readback.execution_result.subject_ref,tenant);
 assert.equal(readback.execution_result.profile_version,String(readback.profile_version));
 assert.equal(readback.decision,'APPROVE');assert.equal(readback.reason,'Independent synthetic approval');
 assert.equal(readback.reviewer_id,reviewer.userId);assert.equal(readback.decision_digest,readback.payload_digest);
 assert.equal(readback.decision_policy,readback.policy_version);assert.equal(readback.grant_status,'CONSUMED');
 assert.equal(readback.consumed_by,owner.userId);assert.equal(readback.executed_events,1);assert.equal(readback.executed_audits,1);
 const lost=await rename('Denied after reviewer revocation');await approve(lost);
 await pool.query("UPDATE aigas_memberships SET role='MEMBER' WHERE tenant_id=$1 AND user_id=$2",[tenant,reviewer.userId]);
 assert.equal((await send(owner,'execute',{},lost)).status,403);
 assert.equal((await pool.query('SELECT name FROM aigas_tenants WHERE id=$1',[tenant])).rows[0].name,'Synthetic renamed');
 await pool.query("UPDATE aigas_memberships SET role='ADMIN' WHERE tenant_id=$1 AND user_id=$2",[tenant,reviewer.userId]);
 const changed=await rename('Denied after target changed');await approve(changed);
 await pool.query("UPDATE aigas_tenants SET name='Synthetic externally changed' WHERE id=$1",[tenant]);
 assert.equal((await send(owner,'execute',{},changed)).status,409);
 assert.equal((await pool.query('SELECT terminal_reason FROM aigas_hg_requests WHERE id=$1',[changed])).rows[0].terminal_reason,'TARGET_CHANGED');
 const cancelled=await rename('Cancelled rename');await approve(cancelled);
 assert.equal((await send(owner,'cancel',{reason:'Synthetic cancellation'},cancelled)).status,200);
 assert.equal((await send(owner,'execute',{},cancelled)).status,409);
 const policyChange=await rename('Denied after policy change');await approve(policyChange);
 const currentPolicy=(await pool.query('SELECT version FROM aigas_hg_policies WHERE tenant_id=$1',[tenant])).rows[0];
 assert.equal((await send(owner,'policy',{version:currentPolicy.version,pending_minutes:60,approval_minutes:30,enabled:true,delegation_enabled:true})).status,200);
 assert.equal((await send(owner,'execute',{},policyChange)).status,410);
 // Delegated review ceases to authorize execution immediately after revocation.
 const delegation=await send(reviewer,'delegate',{delegatee_id:member.userId,operation_type:'KERNEL_WORKSPACE_RENAME',level:'ADMIN',minutes:30,reason:'Synthetic delegation'});
 assert.equal(delegation.status,200,JSON.stringify(delegation.data));
 const delegated=await rename('Denied after delegation revoked');
 const delegatedDecision=await send(member,'decide',{decision:'APPROVE',reason:'Delegated synthetic review'},delegated);
 assert.equal(delegatedDecision.status,200,JSON.stringify(delegatedDecision.data));
 assert.equal((await send(reviewer,'revoke-delegation',{reason:'Synthetic revocation'},delegation.data.delegation.id)).status,200);
 assert.equal((await send(owner,'execute',{},delegated)).status,403);
 const validDelegation=await send(reviewer,'delegate',{delegatee_id:member.userId,operation_type:'INTERNAL_DEMO_NOTE',level:'ADMIN',minutes:30,reason:'Synthetic valid delegation'});
 assert.equal(validDelegation.status,200);
 const delegatedNote=await create();
 assert.equal((await send(member,'decide',{decision:'APPROVE',reason:'Valid delegated review'},delegatedNote)).status,200);
 assert.equal((await send(owner,'execute',{},delegatedNote)).status,200);
 const policyBeforeExpiry=(await pool.query('SELECT version FROM aigas_hg_policies WHERE tenant_id=$1',[tenant])).rows[0];
 assert.equal((await send(owner,'policy',{version:policyBeforeExpiry.version,pending_minutes:1,approval_minutes:1,enabled:true})).status,200);
 const expired=await rename('Denied after expiry');await approve(expired);
 await new Promise(resolve=>setTimeout(resolve,61000));
 assert.equal((await send(owner,'execute',{},expired)).status,410);
 const expiryReadback=(await pool.query('SELECT r.status,r.terminal_reason,g.status AS grant_status,t.name FROM aigas_hg_requests r JOIN aigas_hg_grants g ON g.request_id=r.id JOIN aigas_tenants t ON t.id=r.tenant_id WHERE r.id=$1',[expired])).rows[0];
 assert.deepEqual(expiryReadback,{status:'EXPIRED',terminal_reason:'TIMEOUT',grant_status:'REVOKED',name:'Synthetic externally changed'});
 const rollbackRename=await rename('Must roll back rename');await approve(rollbackRename);
 // Audit failure must roll back request, decision, and demo completion separately.
 const auditPending=await create();
 const approved=await create();await send(reviewer,'decide',{decision:'APPROVE',reason:'Ready for rollback test'},approved);
 await pool.query('ALTER TABLE aigas_audit_events ADD CONSTRAINT synthetic_failure CHECK(false) NOT VALID');
 const count=Number((await pool.query('SELECT count(*) AS n FROM aigas_hg_requests')).rows[0].n);
 assert.equal((await send(owner,'create',input)).status,503);assert.equal(Number((await pool.query('SELECT count(*) AS n FROM aigas_hg_requests')).rows[0].n),count);
 assert.equal((await send(reviewer,'decide',{decision:'APPROVE',reason:'Must roll back'},auditPending)).status,503);
 assert.equal((await pool.query('SELECT status FROM aigas_hg_requests WHERE id=$1',[auditPending])).rows[0].status,'PENDING');
 assert.equal((await pool.query('SELECT id FROM aigas_hg_decisions WHERE request_id=$1',[auditPending])).rowCount,0);
 assert.equal((await send(owner,'execute',{},approved)).status,503);assert.equal((await pool.query('SELECT completed_at FROM aigas_hg_requests WHERE id=$1',[approved])).rows[0].completed_at,null);
 assert.equal((await send(owner,'execute',{},rollbackRename)).status,503);
 const rollback=(await pool.query(`SELECT t.name,r.status,g.status AS grant_status FROM aigas_hg_requests r JOIN aigas_tenants t ON t.id=r.tenant_id JOIN aigas_hg_grants g ON g.request_id=r.id WHERE r.id=$1`,[rollbackRename])).rows[0];
 assert.deepEqual(rollback,{name:'Synthetic externally changed',status:'APPROVED',grant_status:'ACTIVE'});
 await pool.query('UPDATE neon_auth."user" SET banned=true WHERE id=$1',[owner.userId]);assert.equal((await send(owner)).status,401);
 }finally{await pool.end();}
});
