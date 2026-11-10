// Run against a dedicated, disposable PostgreSQL 18 cluster prepared with the
// roles authenticated, anonymous, neondb_owner and LOGIN aigas_runtime.
// No dotenv, remote targets, production credentials, or shared databases.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import pg from 'pg';
import { localDatabaseUrl } from '../tests/helpers/database.mjs';

const names=['KERNEL','FIREWALL','HUMAN_GATE','LEDGER','RISK_ENGINE','KERNEL_IDENTITY','KERNEL_INVITATION'];
const env={PATH:process.env.PATH,TMPDIR:process.env.TMPDIR,LANG:'en_US.UTF-8',TZ:'Asia/Riyadh',AIGAS_REQUIRE_DB_TESTS:'true',AIGAS_REQUIRE_RLS:'true',NODE_OPTIONS:`--import=${new URL('../tests/helpers/no-egress.mjs',import.meta.url).href}`};
const urls=names.map(name=>{
  const key=`${name}_TEST_DATABASE_URL`;
  env[key]=localDatabaseUrl(key);
  assert(env[key],`Missing ${key}`);
  return new URL(env[key]);
});
assert.equal(new Set(urls.map(u=>`${u.host}${u.pathname}`)).size,names.length,'Separate database targets required');
const created=[];
try {
  for (const url of urls) {
    assert(/^\/ar_contract_[a-z_]+$/.test(url.pathname),'Reserved disposable database name required');
    const admin=new URL(url);admin.pathname='/postgres';
    const client=new pg.Client({connectionString:admin.href});await client.connect();
    try {
      assert.equal((await client.query('SHOW server_version_num')).rows[0].server_version_num.slice(0,2),'18');
      // CREATE fails if a database already exists: never reuse or erase it.
      await client.query(`CREATE DATABASE "${url.pathname.slice(1)}"`);
      created.push({admin:admin.href,name:url.pathname.slice(1)});
    } finally {await client.end();}
  }
  const child=spawn(process.execPath,['--test','--test-concurrency=1','--test-reporter=tap','tests/*.test.mjs'],{env,stdio:'inherit'});
  process.exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>resolve(code??1));});
} finally {
  for (const database of created.reverse()) {
    const client=new pg.Client({connectionString:database.admin});await client.connect();
    try {await client.query(`DROP DATABASE "${database.name}" WITH (FORCE)`);}finally{await client.end();}
  }
}
