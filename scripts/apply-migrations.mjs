// Apply migrations to an APPROVED ISOLATED target and record a migration ledger.
//
// The connection string is read from DATABASE_URL_UNPOOLED and is never printed, logged
// or written anywhere. This script holds no credential of its own.
//
// Safety: the target is identified by its shape, not by trust in the caller.
//   --mode fresh  refuses to run unless public has zero tables (production has 31).
//   --mode delta  refuses unless public has exactly the 31 reviewed baseline tables.
// That makes pointing this at production fail closed instead of applying the delta.
//
// Usage:
//   node scripts/apply-migrations.mjs --mode fresh --dry-run
//   node scripts/apply-migrations.mjs --mode fresh --bootstrap-client-roles
//   node scripts/apply-migrations.mjs --mode delta --confirm-live-baseline
//
// Exit codes: 0 applied, 1 failed migration, 2 refused / bad usage, 3 nothing to do.

import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';
import { DELTA_BASELINE, DELTA_ORDER, LIVE_BASELINE_TABLES, CLIENT_ROLES, freshOrder } from './migration-order.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const MIGRATIONS = join(ROOT, 'migrations');
const LEDGER = 'ops.aigas_migration_ledger';

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const value = name => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : undefined; };

const mode = value('--mode');
const dryRun = flag('--dry-run');
const bootstrapRoles = flag('--bootstrap-client-roles');

function refuse(message) {
  console.error(`REFUSED: ${message}`);
  process.exit(2);
}

if (!['fresh', 'delta'].includes(mode)) refuse('--mode must be fresh or delta');

async function loadFiles() {
  const names = (await readdir(MIGRATIONS)).filter(f => f.endsWith('.sql')).sort();
  const files = [];
  for (const name of names) {
    const body = await readFile(join(MIGRATIONS, name), 'utf8');
    files.push({ key: name.slice(0, 4), name, body, sha256: createHash('sha256').update(body).digest('hex') });
  }
  // The delta baseline needs the pre-chain-guard 0003 the live branch actually ran.
  const legacy = await import('node:child_process').then(({ execFileSync }) =>
    execFileSync('git', ['-C', ROOT, 'show', '4e5f9f49^:migrations/0003_aigas_ledger.sql'], { encoding: 'utf8' }));
  files.push({
    key: '0003@pre-chain-guard', name: '0003_aigas_ledger.sql@4e5f9f49^', body: legacy,
    sha256: createHash('sha256').update(legacy).digest('hex'), historical: true,
  });
  return files;
}

const files = await loadFiles();
const byKey = key => files.find(f => f.key === key);
const plan = mode === 'fresh' ? freshOrder(files) : [...DELTA_BASELINE, ...DELTA_ORDER];
const steps = plan.map(key => {
  const file = byKey(key);
  if (!file) refuse(`missing migration ${key}`);
  return file;
});

if (dryRun) {
  console.log(JSON.stringify({
    mode, dryRun: true, target: 'DATABASE_URL_UNPOOLED (not read in dry run)',
    stepCount: steps.length,
    steps: steps.map(s => ({ file: s.name, sha256: s.sha256, baseline: DELTA_BASELINE.includes(s.key) && mode === 'delta' })),
  }, null, 2));
  process.exit(0);
}

const dsn = process.env.DATABASE_URL_UNPOOLED;
if (!dsn) refuse('DATABASE_URL_UNPOOLED is not set in the environment');
if (/(@|\/\/)(localhost|127\.0\.0\.1)/.test(dsn)) refuse('refusing a localhost DSN: use the rehearsal script for local databases');

const client = new pg.Client({ connectionString: dsn, application_name: 'aigas-migration-runner', connectionTimeoutMillis: 15000 });
await client.connect();

const one = async (sql, params) => (await client.query(sql, params)).rows;

const tables = await one(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1`);
const present = tables.map(r => r.tablename);

if (mode === 'fresh') {
  if (present.length !== 0) refuse(`fresh mode requires an empty public schema, found ${present.length} tables`);
} else {
  const expected = new Set(LIVE_BASELINE_TABLES);
  const missing = LIVE_BASELINE_TABLES.filter(t => !present.includes(t));
  const extra = present.filter(t => !expected.has(t));
  if (missing.length || extra.length) {
    refuse(`delta mode requires the reviewed 31-table baseline; missing=[${missing}] extra=[${extra}]`);
  }
  if (!flag('--confirm-live-baseline')) refuse('delta mode also requires --confirm-live-baseline');
}

const [identity] = await one('SELECT current_database() AS db, current_user AS usr, version() AS version');
console.log(`target: db=${identity.db} role=${identity.usr} mode=${mode} tables_before=${present.length}`);

await client.query(`
  CREATE SCHEMA IF NOT EXISTS ops;
  CREATE TABLE IF NOT EXISTS ops.aigas_migration_ledger (
    filename text PRIMARY KEY,
    sha256 text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now(),
    duration_ms integer NOT NULL,
    status text NOT NULL,
    detail text
  );`);

if (bootstrapRoles) {
  // 0018/0025 revoke from the Data API client roles unconditionally. A target without
  // the Data API has no such roles, so the revokes would fail with 42704. Create empty
  // NOLOGIN stubs and grant nothing; 0018/0025 then prove they hold zero privileges.
  for (const role of CLIENT_ROLES) {
    const existing = await one('SELECT 1 FROM pg_roles WHERE rolname = $1', [role]);
    if (!existing.length) {
      await client.query(`CREATE ROLE ${role} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`);
      console.log(`bootstrapped role stub: ${role} (no grants)`);
    }
  }
}

const applied = new Map((await one(`SELECT filename, sha256, status FROM ${LEDGER}`)).map(r => [r.filename, r]));

let changed = 0;
for (const step of steps) {
  const prior = applied.get(step.name);
  if (prior) {
    if (prior.sha256 !== step.sha256) {
      console.error(`ABORT: ${step.name} was applied with sha256 ${prior.sha256.slice(0, 12)}… but the file is now ${step.sha256.slice(0, 12)}…. Review before continuing.`);
      process.exit(1);
    }
    if (prior.status === 'APPLIED') {
      console.log(`skip    ${step.name} (already applied)`);
      continue;
    }
    // A FAILED row means the previous attempt aborted; retry rather than skip, and
    // overwrite the row below so the ledger reflects the final outcome.
    console.log(`retry   ${step.name} (previous attempt recorded ${prior.status})`);
  }
  const started = Date.now();
  try {
    await client.query(step.body);
    const ms = Date.now() - started;
    await client.query(
      `INSERT INTO ${LEDGER}(filename, sha256, duration_ms, status) VALUES($1,$2,$3,'APPLIED')
       ON CONFLICT (filename) DO UPDATE SET status='APPLIED', duration_ms=EXCLUDED.duration_ms, applied_at=now()`,
      [step.name, step.sha256, ms]);
    console.log(`applied ${step.name} (${ms}ms)`);
    changed += 1;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    await client.query(
      `INSERT INTO ${LEDGER}(filename, sha256, duration_ms, status, detail) VALUES($1,$2,$3,'FAILED',$4)
       ON CONFLICT (filename) DO UPDATE SET status='FAILED', detail=EXCLUDED.detail, duration_ms=EXCLUDED.duration_ms, applied_at=now()`,
      [step.name, step.sha256, Date.now() - started, `${error.code || ''} ${error.message}`.trim()]);
    console.error(`FAILED  ${step.name} — ${error.code || ''} ${error.message}`);
    await client.end();
    process.exit(1);
  }
}

const summary = await one(`
  SELECT count(*)::int AS rows,
         count(*) FILTER (WHERE status = 'APPLIED')::int AS applied,
         count(*) FILTER (WHERE status = 'FAILED')::int AS failed
  FROM ${LEDGER}`);
const posture = await one(`
  SELECT (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname='public' AND c.relkind='r') AS tables,
         (SELECT count(*)::int FROM pg_policies WHERE schemaname='public') AS policies,
         (SELECT count(*)::int FROM pg_roles WHERE rolname='aigas_runtime') AS runtime_role`);
console.log(JSON.stringify({ mode, changed, ledger: summary[0], posture: posture[0] }, null, 2));
await client.end();
process.exit(changed === 0 ? 3 : 0);
