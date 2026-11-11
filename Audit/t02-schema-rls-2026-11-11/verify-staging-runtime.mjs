// Synthetic-only, approved Staging. No dotenv, no customer reads or content grants.
import pg from 'pg';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,randomBytes} from 'node:crypto';
const {dsn}=JSON.parse(await readFile('/private/tmp/brightai-t02-staging-connection.json','utf8'));
const url=new URL(dsn);assert.equal(url.hostname,'ep-holy-shape-bdtttebk.c-8.us-east-2.aws.neon.tech');assert.equal(url.pathname,'/neondb');
const owner=new pg.Client({connectionString:dsn,application_name:'aigas-t02-fixture-owner',connectionTimeoutMillis:15000});
const role='aigas_t02_probe_'+randomBytes(5).toString('hex');const password=randomBytes(32).toString('hex');
const A=randomUUID(),B=randomUUID(),UA=randomUUID(),UB=randomUUID(),OUT=randomUUID(),RA=randomUUID(),RB=randomUUID();
let login,created=false,seeded=false;const results=[];const evidence={at:new Date().toISOString(),project:'lucky-salad-43566291',branch:'br-rough-wind-bdkmg13n',database:'neondb',results};
const record=(name,outcome,pass)=>{results.push({name,outcome,pass,at:new Date().toISOString()});if(!pass)throw Error('Probe failed: '+name);};
async function probe(name,tenant,actor,sql,params,accept){
 await login.query('BEGIN');let result;
 try{await login.query('SET LOCAL ROLE aigas_runtime');if(tenant)await login.query("SELECT set_config('aigas.tenant_id',$1,true),set_config('aigas.user_id',$2,true)",[tenant,actor]);const r=await login.query(sql,params);result={rows:r.rows,rowCount:r.rowCount};}
 catch(e){result={code:e.code};}finally{await login.query('ROLLBACK');}
 record(name,result,accept(result));
}
try{
 await owner.connect();
 // A fresh, non-owner login is used for every runtime probe. Owner only seeds/cleans fixtures.
 await owner.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT`);created=true;
 await owner.query(`GRANT aigas_runtime TO ${role} WITH INHERIT FALSE, SET TRUE`);
 url.username=role;url.password=password;
 login=new pg.Client({connectionString:url.href,application_name:'aigas-t02-restricted-login',connectionTimeoutMillis:15000});await login.connect();
 evidence.loginIdentity=(await login.query("SELECT session_user,current_user,r.rolsuper,r.rolbypassrls,r.rolcreaterole,r.rolinherit,(SELECT count(*)::int FROM pg_class WHERE relowner=r.oid AND relnamespace='public'::regnamespace) owned_tables FROM pg_roles r WHERE rolname=session_user")).rows[0];
 assert.equal(evidence.loginIdentity.rolsuper,false);assert.equal(evidence.loginIdentity.rolbypassrls,false);assert.equal(evidence.loginIdentity.owned_tables,0);
 await owner.query('BEGIN');
 try{
 for(const id of [UA,UB,OUT])await owner.query('INSERT INTO neon_auth."user"(id,name,email,"emailVerified") VALUES($1,$2,$3,false)',[id,'T02 Synthetic',`${id}@example.invalid`]);
 await owner.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'T02 Synthetic A'),($2,'T02 Synthetic B')",[A,B]);
 await owner.query("INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'OWNER'),($3,$4,'OWNER')",[A,UA,B,UB]);
 await owner.query("INSERT INTO aigas_fw_rules(id,tenant_id,name,pattern,action,priority) VALUES($1,$2,'T02 A','synthetic','ALLOW',1),($3,$4,'T02 B','synthetic','ALLOW',1)",[RA,A,RB,B]);
 await owner.query('COMMIT');seeded=true;
 }catch(e){await owner.query('ROLLBACK');throw e;}
 await probe('no scope: zero synthetic rows',null,null,'SELECT id FROM aigas_fw_rules WHERE id=ANY($1::uuid[])',[[RA,RB]],r=>r.rowCount===0);
 const one=r=>r.rowCount===1,zero=r=>r.rowCount===0,denied=r=>r.code==='42501';
 for(const [label,t,u,own,other,foreign] of [['A',A,UA,RA,RB,B],['B',B,UB,RB,RA,A]]){
 await probe(`${label} SELECT own`,t,u,'SELECT id FROM aigas_fw_rules WHERE id=$1',[own],one);
 await probe(`${label} SELECT foreign`,t,u,'SELECT id FROM aigas_fw_rules WHERE id=$1',[other],zero);
 await probe(`${label} INSERT own`,t,u,"INSERT INTO aigas_fw_rules(id,tenant_id,name,pattern,action,priority) VALUES($1,$2,'T02 rolled back','synthetic','ALLOW',1)",[randomUUID(),t],one);
 await probe(`${label} INSERT foreign`,t,u,"INSERT INTO aigas_fw_rules(id,tenant_id,name,pattern,action,priority) VALUES($1,$2,'T02 refused','synthetic','ALLOW',1)",[randomUUID(),foreign],denied);
 await probe(`${label} UPDATE own`,t,u,"UPDATE aigas_fw_rules SET name='T02 rolled back' WHERE id=$1",[own],one);
 await probe(`${label} UPDATE foreign`,t,u,"UPDATE aigas_fw_rules SET name='T02 refused' WHERE id=$1",[other],zero);
 await probe(`${label} DELETE own`,t,u,'DELETE FROM aigas_fw_rules WHERE id=$1',[own],one);
 await probe(`${label} DELETE foreign`,t,u,'DELETE FROM aigas_fw_rules WHERE id=$1',[other],zero);
 }
 for(const [verb,sql,params,accept] of [
 ['SELECT','SELECT id FROM aigas_fw_rules WHERE id=$1',[RA],zero],
 ['INSERT',"INSERT INTO aigas_fw_rules(id,tenant_id,name,pattern,action,priority) VALUES($1,$2,'T02 refused','synthetic','ALLOW',1)",[randomUUID(),A],denied],
 ['UPDATE',"UPDATE aigas_fw_rules SET name='T02 refused' WHERE id=$1",[RA],zero],
 ['DELETE','DELETE FROM aigas_fw_rules WHERE id=$1',[RA],zero]])await probe('nonmember '+verb,A,OUT,sql,params,accept);
 await probe('runtime identity',A,UA,'SELECT session_user,current_user,(SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user) bypass',[],r=>r.rows[0].current_user==='aigas_runtime'&&r.rows[0].session_user===role&&!r.rows[0].bypass);
 for(const target of ['neondb_owner','authenticated'])await probe('cannot SET ROLE '+target,A,UA,'SET ROLE '+target,[],denied);
 for(const table of ['aigas_sc_messages','aigas_sc_conversations'])await probe('no Chat body access: '+table,A,UA,`SELECT * FROM ${table} WHERE tenant_id=$1`,[A],denied);
 await probe('activation gaps: readiness and quota absent',A,UA,"SELECT * FROM aigas_trial_activation_gaps(ARRAY['firewall'])",[],r=>r.rows.length===2&&r.rows.some(x=>x.kind==='QUOTA')&&r.rows.some(x=>x.kind==='READINESS'));
 await probe('quota function executable and fail closed',A,UA,"SELECT * FROM aigas_trial_consume_quota($1,$2,'firewall',1,'t02-synthetic-quota')",[randomUUID(),A],r=>r.rows[0]?.allowed===false&&r.rows[0]?.reason==='TRIAL_NOT_FOUND');
 await probe('quota outsider rejected',A,OUT,"SELECT * FROM aigas_trial_consume_quota($1,$2,'firewall',1,'t02-synthetic-quota')",[randomUUID(),A],denied);
 await probe('0032 trigger not a runtime RPC',A,UA,'SELECT aigas_trial_readiness_guard()',[],denied);
 for(const boundary of ['COMMIT','ROLLBACK']){
 await login.query('BEGIN');await login.query('SET LOCAL ROLE aigas_runtime');await login.query("SELECT set_config('aigas.tenant_id',$1,true),set_config('aigas.user_id',$2,true)",[A,UA]);await login.query(boundary);
 const r=(await login.query("SELECT current_user,coalesce(nullif(current_setting('aigas.tenant_id',true),''),'') tenant,coalesce(nullif(current_setting('aigas.user_id',true),''),'') actor")).rows[0];record('no GUC/role leak after '+boundary,r,r.tenant===''&&r.actor===''&&r.current_user===role);
 }
 await probe('rollback preserved original rule',A,UA,'SELECT name FROM aigas_fw_rules WHERE id=$1',[RA],r=>r.rows[0]?.name==='T02 A');
 const direct=await login.query('SELECT id FROM aigas_fw_rules WHERE id=$1',[RA]).then(r=>({rows:r.rowCount})).catch(e=>({code:e.code}));record('NOINHERIT login has no direct privilege',direct,denied(direct));
 evidence.runtimeRole=(await owner.query("SELECT rolname,rolsuper,rolbypassrls,rolcanlogin,rolcreaterole FROM pg_roles WHERE rolname='aigas_runtime'")).rows[0];
 evidence.result='PASS';
}catch(e){evidence.result='FAIL';evidence.failure={code:e.code,message:e.message?.replace(/postgres(?:ql)?:\/\/\S+/g,'<redacted>')};process.exitCode=1;}
finally{
 if(login)await login.end();
 if(seeded){await owner.query('BEGIN');try{await owner.query('DELETE FROM aigas_fw_rules WHERE id=ANY($1::uuid[])',[[RA,RB]]);await owner.query('DELETE FROM aigas_memberships WHERE tenant_id=ANY($1::uuid[])',[[A,B]]);await owner.query('DELETE FROM aigas_tenants WHERE id=ANY($1::uuid[])',[[A,B]]);await owner.query('DELETE FROM neon_auth."user" WHERE id::text=ANY($1::text[])',[[UA,UB,OUT]]);await owner.query('COMMIT');evidence.fixturesRemoved=true;}catch(e){await owner.query('ROLLBACK');evidence.cleanupError=e.code;process.exitCode=1;}}
 if(created)try{await owner.query(`DROP ROLE ${role}`);evidence.probeLoginRemoved=true;}catch(e){evidence.roleCleanupError=e.code;process.exitCode=1;}
 await owner.end();await writeFile(new URL('staging-runtime.json',import.meta.url),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}
