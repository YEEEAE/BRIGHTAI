import { localDatabaseUrl, installSchema, grantProduct, runtime } from './helpers/database.mjs';
// Disposable local PostgreSQL only. Never reads .env or changes remote databases.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomUUID, generateKeyPairSync } from 'node:crypto';
import { createLedgerService } from '../src/server/ledger/service.mjs';
import { createHandler } from '../src/server/ledger/http.mjs';
import { hashEvent, eventFields } from '../src/server/ledger/core.mjs';
import { signEvent } from '../src/server/ledger/signing.mjs';
import { recordProductEvent } from '../src/server/ledger/writer.mjs';
import { audit, tenantGuard } from '../src/server/kernel/service.mjs';
import { kernelEvidence } from '../src/server/agents/runtime.mjs';
import { verifySignedExport } from '../public/downloads/aigas-ledger-signed-verifier.mjs';
const url=localDatabaseUrl('LEDGER_TEST_DATABASE_URL');
test('Postgres + HTTP: durable event, readback, integrity/tamper, tenant isolation, roles, privacy, paging and rollback',{skip:!url},async()=>{
 const savedPrivate=process.env.AIGAS_LEDGER_SIGNING_PRIVATE_KEY, savedKeyId=process.env.AIGAS_LEDGER_SIGNING_KEY_ID, savedRetention=process.env.AIGAS_LEDGER_RETENTION_POLICY_REF;
 process.env.AIGAS_LEDGER_RETENTION_POLICY_REF='SYNTHETIC-TEST-POLICY';
 const keyPair=generateKeyPairSync('ed25519');
 process.env.AIGAS_LEDGER_SIGNING_PRIVATE_KEY=keyPair.privateKey.export({type:'pkcs8',format:'pem'}); process.env.AIGAS_LEDGER_SIGNING_KEY_ID='test-key';
 const db=new pg.Client({connectionString:url});await db.connect();
 try{
 await installSchema(db);
    const owner={userId:randomUUID()},admin={userId:randomUUID()},member={userId:randomUUID()},outsider={userId:randomUUID()};const tenant=randomUUID(),other=randomUUID();
 for(const identity of [owner,admin,member,outsider])await db.query('INSERT INTO neon_auth."user"(id) VALUES($1)',[identity.userId]);
 await db.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic A'),($2,'Synthetic B')",[tenant,other]);
 for(const [u,t,role] of [[owner,tenant,'OWNER'],[admin,tenant,'ADMIN'],[member,tenant,'MEMBER'],[outsider,other,'OWNER']])await db.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)',[t,u.userId,role]);
 await grantProduct(db,tenant,'ledger'); await grantProduct(db,other,'ledger');
 const transact=async work=>{await db.query('BEGIN');await runtime(db);try{const result=await work(db);await db.query('COMMIT');return result;}catch(e){await db.query('ROLLBACK');throw e;}};
 const service=createLedgerService(transact);
 const send=async(identity,op='list',body={},id,scope=tenant,query='')=>{
  const handler=createHandler(async()=>identity,service);const method=['create','verify'].includes(op)?'POST':'GET';
  const path={detail:`/${id}`,verify:`/${id}/verify`,export:`/${id}/export`}[op]??'';
  const req=new Request(`https://brightai.live/app/api/ledger/events${path}/?workspace=${scope}&${query}`,{method,headers:{origin:'https://brightai.live','content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(body)}:{})});
  const response=await handler(req,op,id);return {status:response.status,headers:response.headers,data:await response.json()};
 };
 assert.equal((await send(owner)).data.events.length,0);
 const input={event_type:'synthetic.test.created',scenario:'integrity-check',idempotency_key:randomUUID()};
 delete process.env.AIGAS_LEDGER_SIGNING_PRIVATE_KEY;
 assert.equal((await send(owner,'create',input)).status,503);
 process.env.AIGAS_LEDGER_SIGNING_PRIVATE_KEY=keyPair.privateKey.export({type:'pkcs8',format:'pem'});
 const created=await send(owner,'create',input);assert.equal(created.status,201);assert.equal(created.data.persisted,true);const id=created.data.event.event_id;
 const duplicate=await send(owner,'list',{},undefined,tenant,`workspace=${other}`);
 assert.equal(duplicate.status,400);assert.equal(duplicate.data.code,'INVALID_WORKSPACE');
 const foreignBody=await send(owner,'create',{...input,workspace:other});
 assert.equal(foreignBody.status,400);assert.equal(foreignBody.data.code,'INVALID_BODY');
 const anonymous=await createHandler()(new Request('https://brightai.live/app/api/ledger/events/'),'list');
 assert.equal(anonymous.status,401);assert.equal((await anonymous.json()).authorizationCode,'UNAUTHORIZED');
 const replay=await send(owner,'create',input);assert.equal(replay.status,201);assert.equal(replay.data.replayed,true);assert.equal(replay.data.event.event_id,id);
 assert.equal((await send(owner,'create',{...input,event_type:'synthetic.review.recorded'})).status,409);
 for(const metadata of [{...created.data.event.metadata_json,prompt:'synthetic-secret'},{...created.data.event.metadata_json,scenario:null},{...created.data.event.metadata_json,decision_ref:null}])await assert.rejects(db.query('INSERT INTO aigas_ld_events(event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,integrity_hash,hash_profile,sequence_no,previous_hash,idempotency_key) SELECT $1,tenant_id,source,event_type,policy_version,$2::jsonb,created_at,created_by,repeat(chr(97),64),hash_profile,sequence_no+1,integrity_hash,chr(97) FROM aigas_ld_events WHERE event_id=$3',[randomUUID(),JSON.stringify(metadata),id]),e=>e.code==='23514');
 await assert.rejects(db.query('UPDATE aigas_ld_events SET created_at=now() WHERE event_id=$1',[id]),/append-only/);
 await assert.rejects(db.query('DELETE FROM aigas_ld_events WHERE event_id=$1',[id]),/append-only/);
 await assert.rejects(db.query('DELETE FROM aigas_ld_event_signatures WHERE event_id=$1',[id]),/append-only/);
 const loaded=await send(member);assert.equal(loaded.data.events[0].event_id,id);assert.equal(loaded.data.permissions.create,false);
 assert.equal((await send(member,'detail',{},id)).status,200);
 const unsignedCheck=await send(member,'verify',{},id); assert.equal(unsignedCheck.data.result,'MATCH'); assert.equal(unsignedCheck.data.state,'VERIFIED');
 const candidate=Object.fromEntries(eventFields.map(key=>[key,loaded.data.events[0][key]]));candidate.metadata_json={...candidate.metadata_json,outcome:'REVIEWED'};
 assert.equal((await send(owner,'verify',{candidate},id)).data.result,'MISMATCH');
 assert.equal((await send(owner,'verify',{},id)).data.result,'MATCH'); // candidate never changes stored row
 for(const op of ['detail','verify','export'])assert.equal((await send(outsider,op,{},id,other)).status,404);
 for(const op of ['list','create','detail','verify','export'])assert.equal((await send(outsider,op,op==='create'?input:{},id,tenant)).status,403);
 const forbidden=await send(member,'create',input);assert.equal(forbidden.status,403);assert.equal(forbidden.data.authorizationCode,'FORBIDDEN');assert.equal((await send(member,'export',{},id)).status,403);
 delete process.env.AIGAS_LEDGER_SIGNING_PRIVATE_KEY; delete process.env.AIGAS_LEDGER_SIGNING_KEY_ID;
 assert.equal((await send(admin,'export',{},id)).status,503);
 process.env.AIGAS_LEDGER_SIGNING_PRIVATE_KEY=keyPair.privateKey.export({type:'pkcs8',format:'pem'}); process.env.AIGAS_LEDGER_SIGNING_KEY_ID='test-key';
 delete process.env.AIGAS_LEDGER_RETENTION_POLICY_REF; assert.equal((await send(admin,'export',{},id)).status,503); process.env.AIGAS_LEDGER_RETENTION_POLICY_REF='SYNTHETIC-TEST-POLICY';
 const redacted=await send(admin,'export',{},id,tenant,'redacted=1'); assert.equal(redacted.status,200); assert.equal(redacted.data.bundle.format,'aigas-ledger-redacted-v1'); assert.doesNotMatch(JSON.stringify(redacted.data.bundle.entries),/metadata_json|created_by|idempotency_key/); assert.equal(verifySignedExport(redacted.data,keyPair.publicKey.export({type:'spki',format:'pem'}),'test-key').scope,'SIGNED_HASH_LINKS_ONLY'); assert.equal(redacted.data.bundle.manifest.retention_policy_ref,'SYNTHETIC-TEST-POLICY'); assert.equal((await db.query('SELECT count(*)::int AS n FROM aigas_audit_events WHERE tenant_id=$1 AND action=$2',[tenant,`ledger.event.exported.redacted:${id}:SYNTHETIC-TEST-POLICY`])).rows[0].n,1);
 const exported=await send(admin,'export',{},id);assert.equal(exported.status,200);assert.equal(exported.data.bundle.entries.at(-1).event.event_id,id);assert.equal(exported.data.bundle.verification.result,'MATCH');assert.match(exported.headers.get('content-disposition'),/attachment/);
 const portable=await mkdtemp(join(tmpdir(),'aigas-ledger-contract-'));
 try {
  const file=join(portable,'bundle.json');await writeFile(file,JSON.stringify(exported.data));
  const publicKey=join(portable,'public.pem'); await writeFile(publicKey,keyPair.publicKey.export({type:'spki',format:'pem'}));
  const verify=()=>spawnSync(process.execPath,[new URL('../public/downloads/aigas-ledger-signed-verifier.mjs',import.meta.url).pathname,file,publicKey,'test-key'],{encoding:'utf8',env:{PATH:process.env.PATH,NODE_OPTIONS:process.env.NODE_OPTIONS}});
  const valid=verify();assert.equal(valid.status,0,valid.stderr);assert.equal(JSON.parse(valid.stdout).result,'MATCH');
  const changed=structuredClone(exported.data);changed.bundle.entries[0].event.metadata_json.outcome='REVIEWED';await writeFile(file,JSON.stringify(changed));
  const tampered=verify();assert.notEqual(tampered.status,0);assert.equal(JSON.parse(tampered.stdout).result,'MISMATCH');
 } finally {await rm(portable,{recursive:true});}

 for(const field of ['tenant_id','created_by','metadata_json','source','policy_version','integrity_hash','prompt','conversation'])assert.equal((await send(owner,'create',{...input,[field]:'synthetic-secret'})).status,400);
 assert.equal((await send(owner,'create',{...input,scenario:'synthetic-secret'})).status,400);
 for(let n=0;n<26;n++)assert.equal((await send(admin,'create',{...input,event_type:'synthetic.review.recorded',idempotency_key:randomUUID()})).status,201);
 assert.equal((await send(owner)).data.events.length,25);assert.equal((await send(owner)).data.hasMore,true);
 assert.equal((await send(owner,'list',{},undefined,tenant,'page=2')).data.events.length,2);
 assert.equal((await send(owner,'list',{},undefined,tenant,'type=synthetic.test.created&period=1')).data.events.length,1);
 assert.equal((await send(owner,'list',{},undefined,tenant,`q=${encodeURIComponent(id.slice(0,8))}`)).data.events.length,1);
 assert.equal((await send(owner,'list',{},undefined,tenant,`q=${encodeURIComponent(created.data.event.metadata_json.decision_ref.slice(0,8))}`)).data.events.length,1);
 assert.equal((await send(owner,'list',{},undefined,tenant,`q=${encodeURIComponent('synthetic-secret')}`)).data.events.length,0);
 const tail=(await db.query('SELECT sequence_no,integrity_hash FROM aigas_ld_events WHERE tenant_id=$1 ORDER BY sequence_no DESC LIMIT 1',[tenant])).rows[0];
 const historical={...created.data.event,tenant_id:tenant,sequence_no:String(BigInt(tail.sequence_no)+1n),previous_hash:tail.integrity_hash,idempotency_key:'historical:fixture',event_id:randomUUID(),created_at:'2026-08-01T00:00:00.000Z',metadata_json:{...created.data.event.metadata_json,decision_ref:randomUUID()}};
 historical.integrity_hash=hashEvent(historical);
 await db.query('INSERT INTO aigas_ld_events (event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,integrity_hash,hash_profile,sequence_no,previous_hash,idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[historical.event_id,tenant,historical.source,historical.event_type,historical.policy_version,historical.metadata_json,historical.created_at,historical.created_by,historical.integrity_hash,historical.hash_profile,historical.sequence_no,historical.previous_hash,historical.idempotency_key]);
 assert.equal((await send(admin,'create',{...input,idempotency_key:randomUUID()})).status,503); // unsigned tail blocks append
 const histReceipt=signEvent(historical,{id:'test-key',key:keyPair.privateKey});
 await db.query('INSERT INTO aigas_ld_event_signatures(tenant_id,event_id,key_id,signature) VALUES($1,$2,$3,$4)',[tenant,historical.event_id,histReceipt.key_id,histReceipt.signature]);
 assert.equal((await send(owner,'list',{},undefined,tenant,'page=101')).status,400);
 assert.equal((await send(owner,'list',{},undefined,tenant,'type=synthetic.test.created&period=30')).data.events.length,1);
 assert.equal((await send(owner,'verify',{},id)).data.result,'MATCH');
 assert.doesNotMatch(JSON.stringify((await db.query('SELECT metadata_json FROM aigas_ld_events')).rows),/synthetic-secret|prompt|conversation/);
 // Concurrent transactions use separate connections and the runtime role.
 const transactSeparate=async work=>{const client=new pg.Client({connectionString:url});await client.connect();try{await client.query('BEGIN');await runtime(client);const value=await work(client);await client.query('COMMIT');return value;}catch(error){await client.query('ROLLBACK');throw error;}finally{await client.end();}};
 const concurrent=createLedgerService(transactSeparate);
 const writes=await Promise.all(Array.from({length:8},()=>concurrent(owner,tenant,'create',{...input,idempotency_key:randomUUID()})));
 assert.equal(new Set(writes.map(x=>x.event.sequence_no)).size,8);
 const newest=writes.reduce((a,b)=>BigInt(a.event.sequence_no)>BigInt(b.event.sequence_no)?a:b);
 const full=await concurrent(owner,tenant,'export',{},new URLSearchParams(),newest.event.event_id);
 assert.equal(full.bundle.verification.result,'MATCH');assert.equal(full.bundle.entries.length,36);
 for(let i=0;i<full.bundle.entries.length;i++){assert.equal(String(full.bundle.entries[i].event.sequence_no),String(i+1));assert.equal(full.bundle.entries[i].event.previous_hash,i?full.bundle.entries[i-1].event.integrity_hash:null);}
 const sameKey={...input,idempotency_key:randomUUID()};
 const replays=await Promise.all(Array.from({length:4},()=>concurrent(owner,tenant,'create',sameKey)));
 assert.equal(new Set(replays.map(x=>x.event.event_id)).size,1);
 assert.equal(replays.filter(x=>x.replayed===true).length,3);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM aigas_ld_events WHERE tenant_id=$1 AND idempotency_key=$2',[tenant,`synthetic:${sameKey.idempotency_key}`])).rows[0].n,1);
 const portable2=await mkdtemp(join(tmpdir(),'aigas-ledger-prefix-'));
 try {
  const file=join(portable2,'bundle.json');
  const publicKey=join(portable2,'public.pem'); await writeFile(publicKey,keyPair.publicKey.export({type:'spki',format:'pem'}));
  const check=async bundle=>{await writeFile(file,JSON.stringify(bundle));const child=spawnSync(process.execPath,[new URL('../public/downloads/aigas-ledger-signed-verifier.mjs',import.meta.url).pathname,file,publicKey,'test-key'],{encoding:'utf8',env:{PATH:process.env.PATH,NODE_OPTIONS:process.env.NODE_OPTIONS}});return {status:child.status,result:JSON.parse(child.stdout).result};};
  assert.deepEqual(await check(full),{status:0,result:'MATCH'});
  const changes={event_id:randomUUID(),tenant_id:randomUUID(),source:'other',event_type:'synthetic.review.recorded',policy_version:'changed',metadata_json:{...full.bundle.entries[0].event.metadata_json,outcome:'REVIEWED'},created_at:'2026-01-01T00:00:00.000Z',created_by:randomUUID(),hash_profile:'unsupported',sequence_no:'2',previous_hash:'a'.repeat(64),idempotency_key:'changed',integrity_hash:'b'.repeat(64)};
  for(const [field,value] of Object.entries(changes)){const altered=structuredClone(full);altered.bundle.entries[0].event[field]=value;const result=await check(altered);assert.notEqual(result.status,0,field);assert.notEqual(result.result,'MATCH',field);}
  for(const mutate of [b=>b.bundle.entries.splice(1,1),b=>b.bundle.entries.reverse(),b=>b.bundle.entries.pop(),b=>delete b.bundle.entries[0].event.metadata_json]){const altered=structuredClone(full);mutate(altered);const result=await check(altered);assert.notEqual(result.status,0);assert.notEqual(result.result,'MATCH');}
 } finally {await rm(portable2,{recursive:true});}
 // Agent evidence is tenant-bound, references the actual audit row, and is idempotent.
 const agentContext={action:'kernel.agent.step.completed',correlationId:randomUUID(),policyVersion:'kernel-policy-v1:test',idempotencyKey:'agent:fixture',runId:randomUUID(),causationId:randomUUID(),agentVersion:'1.0.0:test'};
 const agentFirst=await transact(async c=>{await tenantGuard(owner,tenant,c);return kernelEvidence({db:c},owner,tenant,agentContext);});
 const agentReplay=await transact(async c=>{await tenantGuard(owner,tenant,c);return kernelEvidence({db:c},owner,tenant,agentContext);});
 assert.equal(agentFirst.recorded,true); assert.equal(agentReplay.auditId,agentFirst.auditId);
 const agentRows=(await db.query("SELECT metadata_json FROM aigas_ld_events WHERE tenant_id=$1 AND metadata_json->>'audit_ref'=$2",[tenant,agentFirst.auditId])).rows;
 const usageContext={...agentContext, action:'kernel.agent.provider.completed', idempotencyKey:'agent:usage',causationId:randomUUID(),providerUsage:{provider_name:'groq',provider_model:'synthetic-model',usage_input:4,usage_output:2,usage_total:6}};
 const usageReceipt=await transact(async c=>{await tenantGuard(owner,tenant,c);return kernelEvidence({db:c},owner,tenant,usageContext);});
 const usageRow=(await db.query("SELECT metadata_json FROM aigas_ld_events WHERE tenant_id=$1 AND metadata_json->>'audit_ref'=$2",[tenant,usageReceipt.auditId])).rows[0];
 assert.equal(usageRow.metadata_json.usage_total,6); assert.equal(usageRow.metadata_json.provider_model,'synthetic-model');
 assert.equal(agentRows.length,1); assert.equal(agentRows[0].metadata_json.run_ref,agentContext.runId); assert.equal(agentRows[0].metadata_json.correlation_ref,agentContext.correlationId); assert.equal(agentRows[0].metadata_json.causation_ref,agentContext.causationId);
 // Kernel basic audit has no Ledger table or product-license dependency.
 await transact(async c=>{await tenantGuard(owner,tenant,c);return audit(c,owner,tenant,'kernel.synthetic.test');});
 assert.ok((await db.query("SELECT id FROM aigas_audit_events WHERE action='kernel.synthetic.test'")).rowCount);
 // A synthetic policy requires evidence; unavailable Ledger aborts the caller's transaction.
 await db.query("INSERT INTO aigas_ld_evidence_requirements(tenant_id,source,event_type,policy_version,approval_reference,approved_by) VALUES($1,'kernel','kernel.audit.recorded','fixture-v1','SYNTHETIC-ONLY',$2)",[tenant,owner.userId]);
 await db.query("UPDATE aigas_product_access SET status='FOUNDATION' WHERE tenant_id=$1 AND product_slug='ledger'",[tenant]);
 const beforeMandatory=Number((await db.query("SELECT count(*) AS n FROM aigas_audit_events WHERE action='kernel.synthetic.mandatory'")).rows[0].n);
 const ref=randomUUID();
 await assert.rejects(transact(async c=>{await tenantGuard(owner,tenant,c);await audit(c,owner,tenant,'kernel.synthetic.mandatory');await recordProductEvent(c,owner,tenant,{source:'kernel',event_type:'kernel.audit.recorded',correlation_id:ref,decision_id:ref,policy_version:'fixture-v1',idempotency_key:'mandatory:fixture',metadata_json:{synthetic:false,audit_ref:ref,action:'kernel.synthetic.mandatory'}});}),{code:'MANDATORY_EVIDENCE_UNAVAILABLE'});
 assert.equal(Number((await db.query("SELECT count(*) AS n FROM aigas_audit_events WHERE action='kernel.synthetic.mandatory'")).rows[0].n),beforeMandatory);
 await db.query("UPDATE aigas_product_access SET status='ENABLED' WHERE tenant_id=$1 AND product_slug='ledger'",[tenant]);
 await db.query("UPDATE aigas_memberships SET role='MEMBER' WHERE tenant_id=$1 AND user_id=$2",[tenant,admin.userId]);
 assert.equal((await send(admin,'export',{},id)).status,403);
 await db.query('DELETE FROM aigas_memberships WHERE tenant_id=$1 AND user_id=$2',[tenant,member.userId]);
 assert.equal((await send(member)).status,403);
 await db.query('UPDATE neon_auth."user" SET banned=true WHERE id=$1',[outsider.userId]);assert.equal((await send(outsider,'list',{},undefined,other)).status,401);
 const count=Number((await db.query('SELECT count(*) AS n FROM aigas_ld_events')).rows[0].n);
 await db.query("ALTER TABLE aigas_audit_events ADD CONSTRAINT synthetic_failure CHECK (false) NOT VALID");
 assert.equal((await send(owner,'create',{...input,idempotency_key:randomUUID()})).status,503);
 assert.equal(Number((await db.query('SELECT count(*) AS n FROM aigas_ld_events')).rows[0].n),count);
 await db.query('ALTER TABLE public.aigas_ld_events RENAME TO fixture_unavailable_ld_events');
 const missingSchema=await send(owner);
 assert.equal(missingSchema.status,503);
 assert.equal(missingSchema.data.code,'LEDGER_SCHEMA_MISSING');
 assert.match(missingSchema.data.message,/الترحيل المعتمد/);
 if(savedPrivate===undefined) delete process.env.AIGAS_LEDGER_SIGNING_PRIVATE_KEY; else process.env.AIGAS_LEDGER_SIGNING_PRIVATE_KEY=savedPrivate;
 if(savedKeyId===undefined) delete process.env.AIGAS_LEDGER_SIGNING_KEY_ID; else process.env.AIGAS_LEDGER_SIGNING_KEY_ID=savedKeyId;
 if(savedRetention===undefined) delete process.env.AIGAS_LEDGER_RETENTION_POLICY_REF; else process.env.AIGAS_LEDGER_RETENTION_POLICY_REF=savedRetention;
 }finally{await db.end();}
});
