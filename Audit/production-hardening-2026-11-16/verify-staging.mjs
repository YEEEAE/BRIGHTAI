import pg from 'pg';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tenantGuard} from '../../src/server/kernel/service.mjs';
import {connectionPrivilege,requireRlsPosture} from '../../src/server/kernel/db.mjs';
const c=new pg.Client({connectionString:process.env.DATABASE_URL_UNPOOLED,connectionTimeoutMillis:15000,query_timeout:15000});
await c.connect();
const out={generatedAt:new Date().toISOString(),ledger:[],checks:[]};
try {
 const ledger=(await c.query('SELECT filename,sha256,status FROM ops.aigas_migration_ledger ORDER BY filename')).rows;
 for(const r of ledger) out.ledger.push({...r,matches:createHash('sha256').update(await readFile(new URL('../../migrations/'+r.filename,import.meta.url))).digest('hex')===r.sha256});
 out.ledgerPass=ledger.length===32&&out.ledger.every(r=>r.matches&&r.status==='APPLIED');
 await writeFile(new URL('./staging-ledger-hashes.json',import.meta.url),JSON.stringify(out,null,2));
 if(!out.ledgerPass) throw Error('Ledger gate failed');
 // Choose two existing disjoint memberships without exporting identity data.
 const pair=(await c.query(`SELECT a.user_id AS actor,a.tenant_id AS own,b.tenant_id AS other FROM public.aigas_memberships a JOIN public.aigas_memberships b ON a.tenant_id<>b.tenant_id JOIN neon_auth."user" u ON u.id=a.user_id AND u.banned IS NOT TRUE WHERE NOT EXISTS(SELECT 1 FROM public.aigas_memberships m WHERE m.user_id=a.user_id AND m.tenant_id=b.tenant_id) LIMIT 1`)).rows[0];
 if(!pair) throw Error('Two disjoint existing tenants unavailable');
 await c.query('BEGIN');
 await c.query('SET LOCAL ROLE aigas_runtime');
 out.runtime=await connectionPrivilege(c);
 const own=await tenantGuard({userId:pair.actor},pair.own,c);
 out.checks.push({id:'own-tenant',passed:own.tenant?.tenant_id===pair.own});
 try {await tenantGuard({userId:pair.actor},pair.other,c);out.checks.push({id:'cross-tenant-read-guard',passed:false});}catch(e){out.checks.push({id:'cross-tenant-read-guard',status:e.status,code:e.code,passed:e.status===403});}
 await c.query('SAVEPOINT denied_write');
 try {await c.query('INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action) VALUES(gen_random_uuid(),$1,$2,$3)',[pair.other,pair.actor,'synthetic.isolation.probe']);out.checks.push({id:'cross-tenant-write',passed:false});}catch(e){out.checks.push({id:'cross-tenant-write',code:e.code,passed:e.code==='42501'});await c.query('ROLLBACK TO SAVEPOINT denied_write');}
 await c.query('ROLLBACK');
 process.env.AIGAS_REQUIRE_RLS='true';
 const {requireRlsPosture:ownerGuard}=await import("../../src/server/kernel/db.mjs?owner-probe");
 try {await ownerGuard(c);out.checks.push({id:'owner-rls-guard',passed:false});}catch(e){out.checks.push({id:'owner-rls-guard',status:e.status,code:e.code,passed:e.status===503&&e.code==='RLS_NOT_ENFORCED'});}
} catch(e){out.error={code:e.code??null,message:e.message};} finally {await c.query('ROLLBACK').catch(()=>{});await c.end();}
await writeFile(new URL('./staging-isolation.json',import.meta.url),JSON.stringify(out,null,2));
console.log(JSON.stringify({ledgerPass:out.ledgerPass,runtime:out.runtime,checks:out.checks,error:out.error},null,2));
process.exit(out.error||out.checks.some(x=>!x.passed)?1:0);
