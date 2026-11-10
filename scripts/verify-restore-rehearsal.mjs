// Restore-rehearsal verification (P17 / DB02).
//
// Compares a RESTORED database against the SOURCE it was taken from and fails the
// run when the restore is not a faithful, safe copy. All negative probes run inside
// a transaction that is rolled back, so the target keeps the restored state.
//
// It never prints a DSN and never writes outside a rolled-back transaction.
//
// Usage:
//   node scripts/verify-restore-rehearsal.mjs \
//     --source-env DATABASE_URL_UNPOOLED \
//     --target-env RESTORE_DATABASE_URL \
//     [--expect-missing public.table,...]   # tables allowed to differ (loss scenario)
//     [--json <out>]
//
// Exit codes: 0 = PASS, 1 = FAIL, 2 = refused/misconfigured.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import pg from 'pg';

const args = process.argv.slice(2);
const arg = name => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : undefined; };

const sourceEnv = arg('--source-env') ?? 'DATABASE_URL_UNPOOLED';
const targetEnv = arg('--target-env') ?? 'RESTORE_DATABASE_URL';
const jsonOut = arg('--json');
const expectMissing = new Set((arg('--expect-missing') ?? '').split(',').map(s => s.trim()).filter(Boolean));

const ROOT = new URL('..', import.meta.url).pathname;
const MIGRATIONS = join(ROOT, 'migrations');

const sourceDsn = process.env[sourceEnv];
const targetDsn = process.env[targetEnv];
if (!sourceDsn || !targetDsn) {
  console.error(`REFUSED: ${!sourceDsn ? sourceEnv : targetEnv} is not set`);
  process.exit(2);
}
if (sourceDsn === targetDsn) {
  console.error('REFUSED: source and target are the same DSN; a rehearsal needs an isolated target');
  process.exit(2);
}

const connect = (dsn, name) => new pg.Client({
  connectionString: dsn,
  application_name: name,
  connectionTimeoutMillis: 15000,
  query_timeout: 30000,
});

const source = connect(sourceDsn, 'aigas-restore-verify-source');
const target = connect(targetDsn, 'aigas-restore-verify-target');
await source.connect();
await target.connect();

const checks = [];
const record = (id, passed, detail) => checks.push({ id, passed: Boolean(passed), detail });

async function rows(client, sql, params) {
  return (await client.query(sql, params)).rows;
}

// ---------------------------------------------------------------- catalog sets
const CATALOG_QUERIES = {
  tables: `SELECT n.nspname||'.'||c.relname AS name, c.relrowsecurity AS rls, c.relforcerowsecurity AS force
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname IN ('public','ops','neon_auth') AND c.relkind='r' ORDER BY 1`,
  columns: `SELECT table_schema||'.'||table_name||'.'||column_name AS name,
      data_type||coalesce('('||character_maximum_length||')','')||' '||is_nullable||' '||coalesce(column_default,'-') AS def
    FROM information_schema.columns
    WHERE table_schema IN ('public','ops') ORDER BY 1`,
  // Constraint text is compared with parentheses removed: two PostgreSQL builds can
  // deparse the same CHECK with different redundant parentheses.
  constraints: `SELECT n.nspname||'.'||c.relname||'.'||con.conname AS name,
      con.contype::text||'/'||con.convalidated::text||'/'||regexp_replace(pg_get_constraintdef(con.oid), '[()]', '', 'g') AS def
    FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname IN ('public','ops') ORDER BY 1`,
  indexes: `SELECT schemaname||'.'||indexname AS name, indexdef AS def
    FROM pg_indexes WHERE schemaname IN ('public','ops') ORDER BY 1`,
  policies: `SELECT schemaname||'.'||tablename||'.'||policyname||'.'||cmd AS name,
      coalesce(qual,'')||'|'||coalesce(with_check,'') AS def
    FROM pg_policies WHERE schemaname IN ('public','ops') ORDER BY 1`,
  functions: `SELECT n.nspname||'.'||p.proname AS name, pg_get_function_identity_arguments(p.oid) AS def,
      p.prosecdef AS secdef
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE 'aigas%' ORDER BY 1,2`,
  triggers: `SELECT n.nspname||'.'||c.relname||'.'||t.tgname AS name
    FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE NOT t.tgisinternal AND n.nspname IN ('public','ops') ORDER BY 1`,
  roles: `SELECT rolname AS name, rolsuper||'/'||rolbypassrls||'/'||rolcanlogin||'/'||rolinherit AS def
    FROM pg_roles WHERE rolname IN ('aigas_runtime','authenticated','anonymous') ORDER BY 1`,
  trialStates: `SELECT state AS name, count(*)::int::text AS def
    FROM public.aigas_trial_requests GROUP BY state ORDER BY 1`,
  entitlementStatus: `SELECT status AS name, count(*)::int::text AS def
    FROM public.aigas_trial_entitlements GROUP BY status ORDER BY 1`,
};

const sourceCatalog = {};
const targetCatalog = {};
for (const [key, sql] of Object.entries(CATALOG_QUERIES)) {
  sourceCatalog[key] = await rows(source, sql);
  targetCatalog[key] = await rows(target, sql);
}

const asMap = list => new Map(list.map(r => [r.name, JSON.stringify(r)]));
for (const key of Object.keys(CATALOG_QUERIES)) {
  const s = asMap(sourceCatalog[key]);
  const t = asMap(targetCatalog[key]);
  const missing = [...s.keys()].filter(k => !t.has(k));
  const extra = [...t.keys()].filter(k => !s.has(k));
  const changed = [...s.keys()].filter(k => t.has(k) && s.get(k) !== t.get(k));
  record(`catalog.${key}`, missing.length === 0 && extra.length === 0 && changed.length === 0,
    { sourceCount: s.size, targetCount: t.size, missing, extra, changed,
      changedDetail: changed.slice(0, 5).map(k => ({ name: k, source: s.get(k), target: t.get(k) })) });
}

// --------------------------------------------------------------- row counts
const tables = (await rows(source, `SELECT n.nspname||'.'||c.relname AS name
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','ops','neon_auth') AND c.relkind='r' ORDER BY 1`)).map(r => r.name);

const counts = {};
const countDeltas = [];
for (const table of tables) {
  const ident = table.split('.').map(part => `"${part}"`).join('.');
  const s = (await rows(source, `SELECT count(*)::int AS n FROM ${ident}`))[0].n;
  const t = (await rows(target, `SELECT count(*)::int AS n FROM ${ident}`))[0].n;
  counts[table] = { source: s, target: t, delta: t - s };
  if (s !== t && !expectMissing.has(table)) countDeltas.push({ table, source: s, target: t });
}
record('rows.counts', countDeltas.length === 0, { mismatched: countDeltas, tables: counts });

// --------------------------------------------------------------- ledger hashes
const files = (await readdir(MIGRATIONS)).filter(f => f.endsWith('.sql')).sort();
const repoHashes = new Map();
for (const f of files) {
  repoHashes.set(f, createHash('sha256').update(await readFile(join(MIGRATIONS, f), 'utf8')).digest('hex'));
}

for (const [label, client] of [['source', source], ['target', target]]) {
  const ledger = await rows(client, 'SELECT filename, sha256, status FROM ops.aigas_migration_ledger ORDER BY filename')
    .catch(() => null);
  if (!ledger) {
    record(`ledger.${label}.present`, false, 'ops.aigas_migration_ledger is missing');
    continue;
  }
  record(`ledger.${label}.present`, true, { rows: ledger.length });
  const mismatched = ledger.filter(r => repoHashes.has(r.filename) && repoHashes.get(r.filename) !== r.sha256)
    .map(r => r.filename);
  const unknown = ledger.filter(r => !repoHashes.has(r.filename)).map(r => r.filename);
  const notApplied = ledger.filter(r => r.status !== 'APPLIED').map(r => r.filename);
  record(`ledger.${label}.hashes`, mismatched.length === 0 && unknown.length === 0,
    { mismatched, unknown, notApplied });
  const ledgerNames = ledger.map(r => r.filename).sort();
  record(`ledger.${label}.head`, true, { head: ledgerNames.at(-1), count: ledgerNames.length });
}

const sourceLedger = await rows(source, 'SELECT filename FROM ops.aigas_migration_ledger ORDER BY filename').catch(() => []);
const targetLedger = await rows(target, 'SELECT filename FROM ops.aigas_migration_ledger ORDER BY filename').catch(() => []);
record('ledger.restored_matches_source',
  JSON.stringify(sourceLedger.map(r => r.filename)) === JSON.stringify(targetLedger.map(r => r.filename)),
  { source: sourceLedger.length, target: targetLedger.length });

// --------------------------------------------------------------- privileges
const grantSql = `SELECT grantee, count(*)::int AS n FROM information_schema.role_table_grants
  WHERE table_schema='public' GROUP BY grantee ORDER BY grantee`;
const sourceGrants = await rows(source, grantSql);
const targetGrants = await rows(target, grantSql);
record('privileges.grants_match', JSON.stringify(sourceGrants) === JSON.stringify(targetGrants),
  { source: sourceGrants, target: targetGrants });

const clientGrantSql = `SELECT count(*)::int AS n FROM information_schema.role_table_grants
  WHERE table_schema='public' AND grantee IN ('authenticated','anonymous')`;
const clientGrants = (await rows(target, clientGrantSql))[0].n;
record('privileges.no_client_grants_widened', clientGrants === 0, { clientTableGrants: clientGrants });

const publicExec = (await rows(target, `SELECT count(*)::int AS n FROM information_schema.role_routine_grants
  WHERE specific_schema='public' AND grantee='PUBLIC'`))[0].n;
record('privileges.public_execute_count', true, { publicRoutineGrants: publicExec });

const rls = (await rows(target, `SELECT
  (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity) AS enabled,
  (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relkind='r' AND c.relforcerowsecurity) AS forced,
  (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relkind='r') AS total`))[0];
record('privileges.rls_matches_source',
  JSON.stringify(rls) === JSON.stringify((await rows(source, `SELECT
    (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity) AS enabled,
    (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relkind='r' AND c.relforcerowsecurity) AS forced,
    (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relkind='r') AS total`))[0]), rls);

// --------------------------------------------------------- negative probes
// Each probe opens a transaction, runs, records the SQLSTATE and rolls back.
async function probe(id, body, expect) {
  await target.query('BEGIN');
  let outcome;
  try {
    outcome = { value: await body() };
  } catch (error) {
    outcome = { code: error.code, message: String(error.message).split('\n')[0] };
  } finally {
    await target.query('ROLLBACK').catch(() => {});
  }
  record(id, expect(outcome), outcome);
}

const is = code => o => o.code === code;

await probe('negative.authenticated_cannot_read_tenants', async () => {
  await target.query('SET LOCAL ROLE authenticated');
  return (await target.query('SELECT count(*)::int AS n FROM public.aigas_tenants')).rows[0].n;
}, is('42501'));

await probe('negative.runtime_default_deny', async () => {
  await target.query('SET LOCAL ROLE aigas_runtime');
  return (await target.query('SELECT count(*)::int AS n FROM public.aigas_tenants')).rows[0].n;
}, o => o.code === undefined && o.value === 0);

await probe('negative.ledger_forged_link_rejected', async () => {
  const tenant = (await target.query('SELECT id FROM public.aigas_tenants LIMIT 1')).rows[0]?.id
    ?? '11111111-1111-4111-8111-111111111111';
  await target.query(`INSERT INTO public.aigas_tenants (id, name)
    VALUES ($1,'restore-rehearsal') ON CONFLICT DO NOTHING`, [tenant]).catch(() => {});
  await target.query(`INSERT INTO public.aigas_ld_events
    (event_id, tenant_id, sequence_no, source, event_type, policy_version, metadata_json, previous_hash, integrity_hash)
    VALUES (gen_random_uuid(), $1, 2, 'kernel', 'restore.rehearsal', 'p17', '{"synthetic":true}', repeat('0',64), repeat('1',64))`,
  [tenant]);
  return 'inserted';
}, is('P0001'));

await probe('negative.expired_trial_cannot_reactivate', async () => {
  const t = (await target.query(`SELECT id FROM public.aigas_trial_requests WHERE state='EXPIRED' LIMIT 1`)).rows[0];
  if (t) {
    await target.query(`UPDATE public.aigas_trial_requests SET state='ACTIVATED' WHERE id=$1`, [t.id]);
    return 'reactivated';
  }
  // No expired row in the restored copy: prove the guard directly on a synthetic one.
  const tenant = (await target.query('SELECT id FROM public.aigas_tenants LIMIT 1')).rows[0]?.id
    ?? '11111111-1111-4111-8111-111111111111';
  await target.query(`INSERT INTO public.aigas_tenants (id, name)
    VALUES ($1,'restore-rehearsal') ON CONFLICT DO NOTHING`, [tenant]);
  const userId = '99999999-9999-4999-8999-999999999999';
  await target.query(`INSERT INTO neon_auth."user"(id,name,email,"emailVerified")
    VALUES($1,'restore-rehearsal','restore-rehearsal@example.invalid',false) ON CONFLICT DO NOTHING`, [userId]);
  await target.query(`INSERT INTO public.aigas_trial_requests
    (id, tenant_id, requested_by, deployment_mode, business_goal, requested_products,
     state, decided_at, activated_at, expires_at, decision_source)
    VALUES (gen_random_uuid(), $1, $2, 'SAAS', 'restore rehearsal synthetic expired trial',
     ARRAY['ledger'], 'EXPIRED', now()-interval '72 hours', now()-interval '72 hours', now()-interval '24 hours', 'OPERATOR')`,
  [tenant, userId]);
  await target.query(`UPDATE public.aigas_trial_requests SET state='ACTIVATED' WHERE tenant_id=$1`, [tenant]);
  return 'reactivated';
}, is('P0001'));

await probe('negative.trial_cannot_insert_activated', async () => {
  const tenant = (await target.query('SELECT id FROM public.aigas_tenants LIMIT 1')).rows[0]?.id
    ?? '11111111-1111-4111-8111-111111111111';
  await target.query(`INSERT INTO public.aigas_tenants (id, name)
    VALUES ($1,'restore-rehearsal') ON CONFLICT DO NOTHING`, [tenant]).catch(() => {});
  await target.query(`INSERT INTO public.aigas_trial_requests
    (id, tenant_id, requested_by, deployment_mode, business_goal, requested_products, state)
    VALUES (gen_random_uuid(), $1, gen_random_uuid(), 'SAAS', 'direct activation attempt synthetic',
     ARRAY['ledger'], 'ACTIVATED')`, [tenant]);
  return 'inserted';
}, is('P0001'));

// --------------------------------------------------------------- version gate
const targetHead = targetLedger.length ? targetLedger.at(-1).filename : null;
const repoHead = files.at(-1);
// Files the ledger never saw because a later migration folded them into a fresh
// install (0011/0012/0013/0019) are not "pending"; anything ordered after the
// restored head is.
const notInLedger = files.filter(f => !targetLedger.some(r => r.filename === f));
const pending = targetHead
  ? files.filter(f => f.slice(0, 4) > targetHead.slice(0, 4))
  : files;
record('version.repo_head_matches_restored', targetHead === repoHead, {
  repoHead, restoredHead: targetHead, pending, notInLedger,
  verdict: targetHead === repoHead ? 'COMPATIBLE' : 'BLOCKED',
});

// --------------------------------------------------------------- evidence out
const failed = checks.filter(c => !c.passed);
// The version gate is a compatibility verdict, not a copy defect: a faithful restore
// of an older database is still a successful restore. It is reported separately.
const integrityFailed = failed.filter(c => !c.id.startsWith('version.'));
const doc = {
  generatedAt: new Date().toISOString(),
  sourceEnv,
  targetEnv,
  server: {
    source: (await rows(source, 'SHOW server_version'))[0].server_version,
    target: (await rows(target, 'SHOW server_version'))[0].server_version,
  },
  summary: { checks: checks.length, passed: checks.length - failed.length, failed: failed.length },
  versionGate: { repoHead, restoredHead: targetHead, pending },
  checks,
};

console.log(JSON.stringify({ summary: doc.summary, versionGate: doc.versionGate }, null, 2));
for (const c of failed) console.log(`FAIL ${c.id} ${JSON.stringify(c.detail).slice(0, 300)}`);
console.log(`VERSION GATE: ${doc.versionGate.verdict} (restored ${doc.versionGate.restoredHead} vs repo ${doc.versionGate.repoHead})`);
console.log(`INTEGRITY: ${integrityFailed.length ? 'FAIL' : 'PASS'} (${checks.length - failed.length}/${checks.length})`);

if (jsonOut) {
  await mkdir(dirname(jsonOut), { recursive: true });
  await writeFile(jsonOut, JSON.stringify(doc, null, 2));
  console.log(`evidence: ${jsonOut}`);
}

await source.end();
await target.end();
process.exit(integrityFailed.length === 0 ? 0 : 1);
