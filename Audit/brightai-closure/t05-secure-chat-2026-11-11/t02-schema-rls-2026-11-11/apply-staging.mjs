// Explicitly authorized T02 target only. Credentials stay in a mode-0600 temp file.
import pg from 'pg';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url);
const {dsn}=JSON.parse(await readFile('/private/tmp/brightai-t02-staging-connection.json','utf8'));
const url=new URL(dsn);
assert.equal(url.hostname,'ep-holy-shape-bdtttebk.c-8.us-east-2.aws.neon.tech');assert.equal(url.pathname,'/neondb');
const client=new pg.Client({connectionString:dsn,application_name:'aigas-t02-approved-staging',connectionTimeoutMillis:15000});
const capture=async()=>({at:new Date().toISOString(),identity:(await client.query('SELECT current_database(),current_user,version()')).rows,
 tables:(await client.query("SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,pg_get_userbyid(c.relowner) owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY 1")).rows,
 policies:(await client.query("SELECT * FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname")).rows,
 functions:(await client.query("SELECT p.oid::regprocedure::text signature,p.prosecdef,has_function_privilege('aigas_runtime',p.oid,'EXECUTE') runtime,has_function_privilege('authenticated',p.oid,'EXECUTE') authenticated,has_function_privilege('anonymous',p.oid,'EXECUTE') anonymous FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' ORDER BY 1")).rows,
 ledger:(await client.query('SELECT * FROM ops.aigas_migration_ledger ORDER BY filename')).rows});
try{
 await client.connect();const before=await capture();await writeFile(new URL('staging-before.json',import.meta.url),JSON.stringify(before,null,2));
 assert.equal(before.ledger.length,25);for(const r of before.ledger){const b=await readFile(new URL('migrations/'+r.filename,root));assert.equal(r.sha256,createHash('sha256').update(b).digest('hex'));assert.equal(r.status,'APPLIED');}
 const child=spawn(process.execPath,['scripts/apply-migrations.mjs','--mode','resume','--confirm-existing-ledger','--expected-host',url.hostname,'--expected-database','neondb'],{cwd:root,env:{...process.env,DATABASE_URL_UNPOOLED:dsn},stdio:'inherit'});
 const code=await new Promise(r=>child.on('exit',r));assert.equal(code,0);
 const after=await capture();await writeFile(new URL('staging-after.json',import.meta.url),JSON.stringify(after,null,2));
 assert.equal(after.ledger.length,28);for(const row of before.ledger)assert.deepEqual(after.ledger.find(r=>r.filename===row.filename),row);
 for(const r of after.ledger){assert.equal(r.status,'APPLIED');assert.equal(r.sha256,createHash('sha256').update(await readFile(new URL('migrations/'+r.filename,root))).digest('hex'));}
 assert(after.functions.every(f=>!f.authenticated&&!f.anonymous));
 console.log(JSON.stringify({result:'PASS',before:25,after:28,oldReceiptsUnchanged:25,tables:after.tables.length,policies:after.policies.length,functions:after.functions.length,at:after.at}));
}catch(e){console.error(JSON.stringify({result:'FAIL',code:e.code,message:e.message?.replace(/postgres(?:ql)?:\/\/\S+/g,'<redacted>')}));process.exitCode=1;}
finally{await client.end();}
