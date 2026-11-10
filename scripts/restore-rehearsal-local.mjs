// Local restore rehearsal (P17 / DB02) into a throwaway PostgreSQL 18 cluster.
//
// Proves: a logical backup of the isolated target restores into a clean, separate
// cluster and passes catalog / counts / ledger / privilege / trial-guard checks.
// Does NOT prove Neon point-in-time restore, and measures no RPO.
//
// Reads the DSN from a named environment variable inside .env / .env.staging.local
// and passes it to child processes through the environment only, never argv or logs.
//
// Usage: node scripts/restore-rehearsal-local.mjs [--source-env NAME] [--keep]
// Exit: 0 PASS, 1 FAIL, 2 refused.

import { spawnSync } from 'node:child_process';
import pg from 'pg';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PGBIN = process.env.PGBIN ?? '/opt/homebrew/opt/postgresql@18/bin';
const PORT = process.env.REHEARSAL_PORT ?? '55417';

const args = process.argv.slice(2);
const argValue = name => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : undefined; };
const KEEP = args.includes('--keep');
const SOURCE_ENV = argValue('--source-env') ?? 'AIGAS_STAGING_DATABASE_URL_UNPOOLED';

function loadEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const isolated = { ...loadEnv(join(ROOT, '.env.staging.local')), ...loadEnv(join(ROOT, '.env')) };
const isolatedFirst = { ...loadEnv(join(ROOT, '.env')), ...loadEnv(join(ROOT, '.env.staging.local')) };
// Production reference comes from .env alone; the isolated value wins when both exist.
const productionDsn = loadEnv(join(ROOT, '.env')).DATABASE_URL_UNPOOLED;
const sourceDsn = isolatedFirst[SOURCE_ENV];

if (!sourceDsn) {
  console.error(`REFUSED: ${SOURCE_ENV} is not set in .env / .env.staging.local`);
  process.exit(2);
}
if (productionDsn && sourceDsn === productionDsn) {
  console.error(`REFUSED: ${SOURCE_ENV} resolves to the production DSN; a rehearsal must read an isolated target`);
  process.exit(2);
}
if (SOURCE_ENV === 'DATABASE_URL_UNPOOLED' && loadEnv(join(ROOT, '.env')).DATABASE_URL_UNPOOLED) {
  console.error('REFUSED: DATABASE_URL_UNPOOLED in .env is the production target');
  process.exit(2);
}

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const work = mkdtempSync(join(tmpdir(), `aigas-restore-${stamp}.`));
const evidenceDir = join(ROOT, 'Audit/p17-restore-rehearsal-2026-11-10/evidence');
mkdirSync(evidenceDir, { recursive: true });
const logPath = join(evidenceDir, `local-restore-${stamp}.log`);
const logLines = [];
const say = line => { logLines.push(line); console.log(line); };
const flushLog = () => writeFileSync(logPath, `${logLines.join('\n')}\n`);

const env = { ...process.env, LC_ALL: 'C', LANG: 'C' };
const run = (cmd, cmdArgs, options = {}) => spawnSync(cmd, cmdArgs, {
  encoding: 'utf8',
  env,
  maxBuffer: 64 * 1024 * 1024,
  ...options,
});

let started = false;
function stopCluster() {
  if (started) run(`${PGBIN}/pg_ctl`, ['-D', join(work, 'cluster'), '-m', 'immediate', 'stop']);
  started = false;
}

function finish(code) {
  stopCluster();
  flushLog();
  if (!KEEP) rmSync(work, { recursive: true, force: true });
  else say(`kept: ${work}`);
  process.exit(code);
}

say('== P17 local restore rehearsal ==');
say(`utc:        ${stamp}`);
say(`source:     ${SOURCE_ENV} (value never printed)`);
say(`pgbin:      ${PGBIN}`);
say(`workdir:    ${work}`);

// ------------------------------------------------------------------ 1. backup
say('-- 1. logical backup (custom format)');
const dumpPath = join(work, 'source.dump');
const dumpStart = Date.now();
const dump = run(`${PGBIN}/pg_dump`, [sourceDsn, '--format=custom', '--no-password', `--file=${dumpPath}`]);
const dumpSeconds = Math.round((Date.now() - dumpStart) / 1000);
if (dump.status !== 0) {
  say(`FAIL: pg_dump exited ${dump.status}`);
  say(String(dump.stderr).slice(0, 2000));
  finish(1);
}
const dumpBytes = statSync(dumpPath).size;
say(`backup:     ${dumpSeconds}s, ${dumpBytes} bytes`);

// ------------------------------------------------------------------ 2. target
say('-- 2. isolated cluster (PG18, fresh data dir)');
const initdb = run(`${PGBIN}/initdb`, ['-D', join(work, 'cluster'), '-U', 'postgres', '--auth=trust', '--encoding=UTF8', '--locale=C']);
if (initdb.status !== 0) {
  say('FAIL: initdb');
  say(String(initdb.stderr).slice(0, 2000));
  finish(1);
}
const start = run(`${PGBIN}/pg_ctl`, [
  '-D', join(work, 'cluster'),
  '-o', `-p ${PORT} -c listen_addresses=127.0.0.1 -c fsync=off`,
  '-l', join(work, 'pg.log'), '-w', 'start',
]);
if (start.status !== 0) {
  say('FAIL: pg_ctl start');
  say(String(start.stderr).slice(0, 2000));
  finish(1);
}
started = true;
say(`cluster:    up on 127.0.0.1:${PORT}`);

// Platform-scoped roles are never inside a pg_dump, so a faithful target pre-creates
// them. Application roles keep the exact attributes the source cluster has.
const sourceClient = new pg.Client({ connectionString: sourceDsn, connectionTimeoutMillis: 15000 });
await sourceClient.connect();
const roleAttrs = (await sourceClient.query(`SELECT rolname, rolsuper, rolbypassrls, rolcanlogin, rolinherit
  FROM pg_roles WHERE rolname IN ('aigas_runtime','authenticated','anonymous') ORDER BY rolname`)).rows;
await sourceClient.end();
const appRoles = roleAttrs.map(r => `CREATE ROLE ${r.rolname}
  ${r.rolcanlogin ? 'LOGIN' : 'NOLOGIN'}
  ${r.rolsuper ? 'SUPERUSER' : 'NOSUPERUSER'}
  ${r.rolbypassrls ? 'BYPASSRLS' : 'NOBYPASSRLS'}
  ${r.rolinherit ? 'INHERIT' : 'NOINHERIT'};`).join('\n');
const bootstrap = `CREATE ROLE neondb_owner LOGIN;
${appRoles}
CREATE ROLE neon_auth NOLOGIN;
CREATE ROLE neon_service NOLOGIN;
CREATE ROLE neon_superuser NOLOGIN;
CREATE ROLE authenticator NOLOGIN;
CREATE ROLE cloud_admin NOLOGIN;
GRANT neondb_owner TO postgres;`;
const psqlBase = ['-h', '127.0.0.1', '-p', PORT, '-U', 'postgres'];
const roles = run(`${PGBIN}/psql`, [...psqlBase, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q', '-c', bootstrap]);
if (roles.status !== 0) {
  say('FAIL: role bootstrap');
  say(String(roles.stderr).slice(0, 2000));
  finish(1);
}
const createDb = run(`${PGBIN}/createdb`, [...psqlBase, '-O', 'neondb_owner', 'neondb']);
if (createDb.status !== 0) {
  say('FAIL: createdb');
  say(String(createDb.stderr).slice(0, 2000));
  finish(1);
}

// ------------------------------------------------------------------ 3. restore
say('-- 3. restore (measured)');
const restoreStart = Date.now();
const restore = run(`${PGBIN}/pg_restore`, [...psqlBase, '-d', 'neondb', '--no-password', dumpPath]);
const restoreMs = Date.now() - restoreStart;
const restoreErr = String(restore.stderr ?? '');
writeFileSync(join(work, 'restore.err'), restoreErr);
const errorLines = restoreErr.split('\n').filter(l => l.startsWith('pg_restore: error:'));
// A stock PostgreSQL cannot install Neon-provided extensions; record that gap only.
const unexpected = errorLines.filter(l => !l.includes('pg_session_jwt'));
const neonGap = restoreErr.split('\n').filter(l => l.includes('pg_session_jwt')).length;
say(`restore:    ${restoreMs}ms (exit ${restore.status}, ${errorLines.length} error lines, ${neonGap} neon-extension gap lines)`);
if (unexpected.length) {
  say('FAIL: unexpected restore errors');
  for (const line of unexpected.slice(0, 10)) say(line);
  finish(1);
}

// ------------------------------------------------------------------ 4. verify
say('-- 4. verification (catalog, counts, ledger, privileges, trial guards, version)');
const verifyJson = join(evidenceDir, `local-verify-${stamp}.json`);
const verify = run(process.execPath, [
  join(ROOT, 'scripts/verify-restore-rehearsal.mjs'),
  '--source-env', SOURCE_ENV,
  '--target-env', 'REHEARSAL_TARGET_URL',
  '--json', verifyJson,
], {
  cwd: ROOT,
  env: {
    ...env,
    [SOURCE_ENV]: sourceDsn,
    REHEARSAL_TARGET_URL: `postgresql://postgres@127.0.0.1:${PORT}/neondb`,
  },
});
say(String(verify.stdout).trim());
if (verify.status !== 0) say(String(verify.stderr).slice(0, 2000));

// ------------------------------------------------------------------ 5. evidence
const measurements = {
  generatedAt: new Date().toISOString(),
  method: 'logical backup (pg_dump custom) -> fresh PG18 cluster (pg_restore)',
  sourceEnv: SOURCE_ENV,
  target: `127.0.0.1:${PORT}/neondb (throwaway, destroyed)`,
  backupSeconds: dumpSeconds,
  restoreMilliseconds: restoreMs,
  dumpBytes,
  restoreExitCode: restore.status,
  neonExtensionGapLines: neonGap,
  verifyExit: verify.status,
  scope: 'logical restore only; no Neon point-in-time restore, no RPO measurement',
};
writeFileSync(join(evidenceDir, `local-measurements-${stamp}.json`), `${JSON.stringify(measurements, null, 2)}\n`);

say('-- 5. measurements');
say(`backup_seconds=${dumpSeconds}`);
say(`restore_ms=${restoreMs}`);
say(`dump_bytes=${dumpBytes}`);
say(`verify_exit=${verify.status}`);
say(verify.status === 0 ? 'RESULT: PASS' : 'RESULT: FAIL');
finish(verify.status === 0 ? 0 : 1);
