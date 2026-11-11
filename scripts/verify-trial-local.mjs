// Disposable local PostgreSQL 18 harness for P06-A trial verification. LOCAL ONLY.
//
// Creates a socket + loopback cluster under $TMPDIR, shapes the roles the AIGAS
// migrations expect (including a LOGIN aigas_runtime for the runtime path), then
// runs the existing contract harness over real disposable databases. It never
// loads .env, never connects to Neon, and destroys the cluster unless --keep.
//
// Usage: node scripts/verify-trial-local.mjs [--keep]

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';

const PGBIN = process.env.P06_PG_BIN || '/opt/homebrew/opt/postgresql@18/bin';
const WORK = await mkdtemp(join(process.env.TMPDIR || '/tmp', 'p06-trial-verify-'));
const DATA = join(WORK, 'data');
const SOCK = join(WORK, 'sock');
const PORT = process.env.P06_PG_PORT || '55433';
const keep = process.argv.includes('--keep');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let out = ''; let err = '';
    child.stdout.on('data', chunk => { out += chunk; });
    child.stderr.on('data', chunk => { err += chunk; });
    child.on('error', reject);
    child.on('exit', code => resolve({ code, out, err }));
  });
}

async function withClient(database, user, work) {
  const client = new pg.Client({ host: '127.0.0.1', port: Number(PORT), user, database });
  await client.connect();
  try { return await work(client); } finally { await client.end(); }
}

async function bootstrap() {
  await mkdir(SOCK, { recursive: true });
  if (!existsSync(join(DATA, 'PG_VERSION'))) {
    const init = await run(join(PGBIN, 'initdb'), ['-D', DATA, '-U', 'postgres', '-A', 'trust', '--locale=C', '--encoding=UTF8']);
    if (init.code !== 0) throw new Error(`initdb failed: ${init.err}`);
  }
  const start = await run(join(PGBIN, 'pg_ctl'), ['-D', DATA, '-o', `-k ${SOCK} -c listen_addresses=127.0.0.1 -p ${PORT} -c fsync=off`, '-w', 'start']);
  if (start.code !== 0 && !/already running/.test(start.err)) throw new Error(`pg_ctl start failed: ${start.err}`);

  await withClient('postgres', 'postgres', async client => {
    const roles = [
      ['neondb_owner', 'LOGIN NOSUPERUSER INHERIT CREATEROLE CREATEDB REPLICATION BYPASSRLS'],
      ['neon_superuser', 'NOLOGIN NOSUPERUSER INHERIT CREATEROLE CREATEDB REPLICATION BYPASSRLS'],
      ['cloud_admin', 'LOGIN SUPERUSER INHERIT CREATEROLE CREATEDB REPLICATION BYPASSRLS'],
      ['neon_auth', 'LOGIN NOSUPERUSER NOINHERIT'],
      ['authenticated', 'NOLOGIN NOSUPERUSER INHERIT'],
      ['anonymous', 'NOLOGIN NOSUPERUSER INHERIT'],
      ['authenticator', 'LOGIN NOSUPERUSER NOINHERIT'],
      // The real service logs in as the runtime role; 0025 keeps LOGIN on an
      // existing role and enforces NOBYPASSRLS/NOSUPERUSER.
      ['aigas_runtime', 'LOGIN NOSUPERUSER NOINHERIT NOBYPASSRLS'],
    ];
    for (const [name, attributes] of roles) {
      if (!(await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [name])).rowCount) {
        await client.query(`CREATE ROLE ${name} ${attributes}`);
      }
    }
    await client.query('GRANT neon_superuser, authenticated, anonymous, neon_auth TO neondb_owner');
  });
}

async function main() {
  await bootstrap();
  const names = ['KERNEL', 'FIREWALL', 'HUMAN_GATE', 'LEDGER', 'RISK_ENGINE', 'RISK_ENGINE_RESIDUAL', 'KERNEL_IDENTITY', 'KERNEL_INVITATION', 'KERNEL_TRIAL'];
  const env = {
    PATH: process.env.PATH,
    TMPDIR: process.env.TMPDIR,
    LANG: 'en_US.UTF-8',
    TZ: 'Asia/Riyadh',
    AIGAS_REQUIRE_DB_TESTS: 'true',
    AIGAS_REQUIRE_RLS: 'true',
    AIGAS_ENVIRONMENT: 'local',
    AIGAS_RELEASE_SHA: process.env.AIGAS_RELEASE_SHA || 'a'.repeat(40),
  };
  for (const name of names) {
    env[`${name}_TEST_DATABASE_URL`] = `postgres://postgres@127.0.0.1:${PORT}/ar_contract_${name.toLowerCase()}`;
  }
  const child = spawn(process.execPath, ['scripts/verify-contracts-local.mjs'], { env, stdio: 'inherit' });
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', value => resolve(value ?? 1));
  });
  console.log(JSON.stringify({ result: code === 0 ? 'PASS' : 'FAIL', exitCode: code, databases: names.length, port: Number(PORT), keptCluster: keep }, null, 2));
  process.exitCode = code;
}

await main().catch(async error => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (!keep) {
    await run(join(PGBIN, 'pg_ctl'), ['-D', DATA, '-m', 'immediate', 'stop']).catch(() => {});
    await rm(WORK, { recursive: true, force: true }).catch(() => {});
  }
});
