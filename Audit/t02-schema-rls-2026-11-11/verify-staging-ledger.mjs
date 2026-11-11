import pg from 'pg';import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';import {spawn} from 'node:child_process';import {createHash} from 'node:crypto';
const {dsn}=JSON.parse(await readFile('/private/tmp/brightai-t02-staging-connection.json','utf8'));const url=new URL(dsn);assert.equal(url.hostname,'ep-holy-shape-bdtttebk.c-8.us-east-2.aws.neon.tech');
const c=new pg.Client({connectionString:dsn,connectionTimeoutMillis:15000});await c.connect();
try{
 const before=(await c.query('SELECT * FROM ops.aigas_migration_ledger ORDER BY filename')).rows;
 const child=spawn(process.execPath,['scripts/apply-migrations.mjs','--mode','resume','--confirm-existing-ledger','--expected-host',url.hostname,'--expected-database','neondb'],{env:{...process.env,DATABASE_URL_UNPOOLED:dsn},stdio:'inherit'});
 const code=await new Promise(r=>child.on('exit',r));assert.equal(code,3);
 const after=(await c.query('SELECT * FROM ops.aigas_migration_ledger ORDER BY filename')).rows;assert.deepEqual(after,before);assert.equal(after.length,28);
 for(const row of after){assert.equal(row.status,'APPLIED');assert.equal(row.sha256,createHash('sha256').update(await readFile('migrations/'+row.filename)).digest('hex'));}
 const columns=(await c.query("SELECT c.relname,a.attname,x.privilege_type FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid CROSS JOIN LATERAL aclexplode(a.attacl) x WHERE c.relnamespace='public'::regnamespace AND x.grantee='aigas_runtime'::regrole ORDER BY 1,2,3")).rows;assert.equal(columns.length,18);
 const treatment=(await c.query("SELECT pg_get_functiondef('public.aigas_re_guard_treatment()'::regprocedure) definition")).rows[0];assert(treatment.definition.includes('aigas_lock_member'));assert(treatment.definition.includes('Residual score and level'));
 const gates=(await c.query('SELECT (SELECT count(*)::int FROM aigas_trial_operators) operators,(SELECT count(*)::int FROM aigas_release_readiness) readiness,(SELECT count(*)::int FROM aigas_trial_quota_limits) quotas')).rows[0];assert.deepEqual(gates,{operators:0,readiness:0,quotas:0});
 const leftover=(await c.query("SELECT count(*)::int n FROM pg_roles WHERE rolname LIKE 'aigas_t02_probe_%'")).rows[0].n;assert.equal(leftover,0);
 const evidence={at:new Date().toISOString(),result:'PASS',rerunExit:code,unchangedReceipts:28,ledger:after,columnGrants:columns,treatment,gates,leftoverProbeRoles:leftover};await writeFile(new URL('staging-final.json',import.meta.url),JSON.stringify(evidence,null,2));console.log(JSON.stringify({result:'PASS',ledger:28,rerunExit:code,columnGrants:18,gates,leftoverProbeRoles:leftover}));
}finally{await c.end();}
