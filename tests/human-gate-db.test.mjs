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
 // Audit failure must roll back request, decision, and demo completion separately.
 const approved=await create();await send(reviewer,'decide',{decision:'APPROVE',reason:'Ready for rollback test'},approved);
 await pool.query('ALTER TABLE aigas_audit_events ADD CONSTRAINT synthetic_failure CHECK(false) NOT VALID');
 const count=Number((await pool.query('SELECT count(*) AS n FROM aigas_hg_requests')).rows[0].n);
 assert.equal((await send(owner,'create',input)).status,503);assert.equal(Number((await pool.query('SELECT count(*) AS n FROM aigas_hg_requests')).rows[0].n),count);
 assert.equal((await send(reviewer,'decide',{decision:'APPROVE',reason:'Must roll back'},pending)).status,503);
 assert.equal((await pool.query('SELECT status FROM aigas_hg_requests WHERE id=$1',[pending])).rows[0].status,'PENDING');
 assert.equal((await pool.query('SELECT id FROM aigas_hg_decisions WHERE request_id=$1',[pending])).rowCount,0);
 assert.equal((await send(owner,'execute',{},approved)).status,503);assert.equal((await pool.query('SELECT completed_at FROM aigas_hg_requests WHERE id=$1',[approved])).rows[0].completed_at,null);
 await pool.query('UPDATE neon_auth."user" SET banned=true WHERE id=$1',[owner.userId]);assert.equal((await send(owner)).status,401);
 }finally{await pool.end();}
});
