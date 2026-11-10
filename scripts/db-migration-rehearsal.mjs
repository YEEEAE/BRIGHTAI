// Disposable PostgreSQL 18 migration rehearsal. LOCAL ONLY.
//
// Purpose: prove migration order, ordering guards, privilege/GUC dependencies and a
// migration ledger against a database built from migrations/ — never from a dump,
// never against Neon, never with production credentials or customer rows.
//
// The cluster is created under $TMPDIR, listens on a unix socket only (no TCP, no
// external network), and is destroyed unless --keep is passed. The privilege posture
// is shaped to match the inspected Neon branch: neondb_owner is a non-superuser with
// BYPASSRLS, member of authenticated/anonymous/neon_superuser/neon_auth, and its
// default ACL auto-grants client roles. Without that posture the 0018/0025 revokes
// would be untested no-ops.
//
// Usage: node scripts/db-migration-rehearsal.mjs [--keep] [--json <path>]
// No dotenv, no DSN env var, no network.

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';
import { DELTA_BASELINE, DELTA_ORDER, freshOrder } from './migration-order.mjs';

const PGBIN = process.env.P02_PG_BIN || '/opt/homebrew/opt/postgresql@18/bin';
const ROOT = new URL('..', import.meta.url).pathname;
const MIGRATIONS = join(ROOT, 'migrations');
const WORK = join(process.env.TMPDIR || '/tmp', 'p02-rehearsal');
const DATA = join(WORK, 'data');
const SOCK = join(WORK, 'sock');
const PORT = '5439';

// Guards phase stops before 0025 so out-of-order refusal can be observed.
const GUARD_BASELINE = DELTA_BASELINE;
const GUARD_ORDER = ['0013', '0014', '0016', '0017', '0018', '0020', '0021', '0022', '0023'];

const keep = process.argv.includes('--keep');
const jsonIndex = process.argv.indexOf('--json');
const jsonPath = jsonIndex > -1 ? process.argv[jsonIndex + 1] : null;

const evidence = { generatedAt: new Date().toISOString(), phases: {}, negative: [], postures: {} };

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let out = ''; let err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('error', reject);
    child.on('exit', code => resolve({ code, out, err }));
  });
}

function clientConfig(database, user = 'neondb_owner') {
  return { host: SOCK, port: Number(PORT), user, database };
}

async function withClient(database, work, user) {
  const client = new pg.Client(clientConfig(database, user));
  await client.connect();
  try { return await work(client); } finally { await client.end(); }
}

async function historical(file, rev) {
  const result = await run('git', ['-C', ROOT, 'show', `${rev}:migrations/${file}`]);
  if (result.code !== 0) throw new Error(`cannot read ${file} at ${rev}: ${result.err}`);
  return result.out;
}

async function migrationFiles() {
  const entries = (await readdir(MIGRATIONS)).filter(f => f.endsWith('.sql')).sort();
  const files = [];
  for (const name of entries) {
    const body = await readFile(join(MIGRATIONS, name), 'utf8');
    files.push({ key: name.slice(0, 4), name, body, sha256: createHash('sha256').update(body).digest('hex') });
  }
  // Historical 0003 that the live branch actually ran (no chain guard).
  const legacy = await historical('0003_aigas_ledger.sql', '4e5f9f49^');
  files.push({ key: '0003@pre-chain-guard', name: '0003_aigas_ledger.sql@4e5f9f49^', body: legacy, sha256: createHash('sha256').update(legacy).digest('hex'), historical: true });
  return files;
}

async function bootstrapCluster() {
  await mkdir(SOCK, { recursive: true });
  if (!existsSync(join(DATA, 'PG_VERSION'))) {
    const init = await run(join(PGBIN, 'initdb'), ['-D', DATA, '-U', 'bootstrap_admin', '-A', 'trust', '--locale=C', '--encoding=UTF8']);
    if (init.code !== 0) throw new Error(`initdb failed: ${init.err}`);
  }
  const start = await run(join(PGBIN, 'pg_ctl'), ['-D', DATA, '-o', `-k ${SOCK} -c listen_addresses='' -p ${PORT} -c fsync=off -c full_page_writes=off`, '-w', 'start']);
  if (start.code !== 0 && !/already running/.test(start.err)) throw new Error(`pg_ctl start failed: ${start.err}`);

  await withClient('postgres', async client => {
    const roles = [
      // Attributes read from the live branch on 2026-11-10 (pg_roles) — must match,
      // otherwise 0025 fails at CREATE ROLE for the wrong reason.
      ['neondb_owner', 'LOGIN NOSUPERUSER INHERIT CREATEROLE CREATEDB REPLICATION BYPASSRLS'],
      ['neon_superuser', 'NOLOGIN NOSUPERUSER INHERIT CREATEROLE CREATEDB REPLICATION BYPASSRLS'],
      ['cloud_admin', 'LOGIN SUPERUSER INHERIT CREATEROLE CREATEDB REPLICATION BYPASSRLS'],
      ['neon_auth', 'LOGIN NOSUPERUSER NOINHERIT'],
      ['authenticated', 'NOLOGIN NOSUPERUSER INHERIT'],
      ['anonymous', 'NOLOGIN NOSUPERUSER INHERIT'],
      ['authenticator', 'LOGIN NOSUPERUSER NOINHERIT'],
    ];
    for (const [name, attrs] of roles) {
      if (!(await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [name])).rowCount) {
        await client.query(`CREATE ROLE ${name} ${attrs}`);
      }
    }
    await client.query('GRANT neon_superuser, authenticated, anonymous, neon_auth TO neondb_owner');
    await client.query('GRANT authenticated, anonymous TO authenticator');
    const version = (await client.query('SHOW server_version')).rows[0].server_version;
    evidence.serverVersion = version;
  }, 'bootstrap_admin');
}

async function resetCluster() {
  // Phase isolation: CREATE ROLE is cluster-scoped and the previous phase's objects
  // depend on it, so every disposable database must go first.
  await withClient('postgres', async client => {
    const dbs = (await client.query("SELECT datname FROM pg_database WHERE datname LIKE 'p02\\_%'")).rows;
    for (const { datname } of dbs) await client.query(`DROP DATABASE "${datname}" WITH (FORCE)`);
    await client.query('DROP ROLE IF EXISTS aigas_runtime').catch(() => {});
  }, 'bootstrap_admin');
}

async function createDatabase(name) {
  await resetCluster();
  await withClient('postgres', async client => {
    await client.query(`CREATE DATABASE ${name} OWNER neondb_owner`);
  }, 'bootstrap_admin');
  await withClient(name, async client => {
    // A project without the Data API or Neon Auth has no client roles, so there is
    // no default ACL to mirror. The client_roles_absent phase relies on this.
    const hasClientRoles = (await client.query(
      "SELECT count(*)::int AS n FROM pg_roles WHERE rolname IN ('authenticated','anonymous')")).rows[0].n === 2;
    if (hasClientRoles) await client.query(`
      ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT USAGE ON SEQUENCES TO anonymous;`);
    await client.query('CREATE SCHEMA IF NOT EXISTS neon_auth AUTHORIZATION neon_auth');
    await client.query(`
      SET ROLE neon_auth;
      CREATE TABLE neon_auth."user" (id uuid PRIMARY KEY, name text NOT NULL DEFAULT 'Synthetic', email text NOT NULL DEFAULT 'synthetic@example.test', banned boolean, role text, "emailVerified" boolean);
      CREATE TABLE neon_auth.organization (id uuid PRIMARY KEY, name text);
      CREATE TABLE neon_auth.invitation (id uuid PRIMARY KEY, email text, status text, "expiresAt" timestamptz, "organizationId" uuid, "inviterId" uuid, role text);
      CREATE TABLE neon_auth.member (id uuid PRIMARY KEY, "organizationId" uuid, "userId" uuid, role text);
      RESET ROLE;`);
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS ops;
      CREATE TABLE IF NOT EXISTS ops.aigas_migration_ledger (
        filename text PRIMARY KEY,
        sha256 text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now(),
        duration_ms integer NOT NULL,
        status text NOT NULL,
        detail text);`);
  });
}

async function applyFile(client, file) {
  const started = Date.now();
  try {
    await client.query(file.body);
    return { status: 'APPLIED', duration_ms: Date.now() - started };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return { status: 'FAILED', duration_ms: Date.now() - started, detail: `${error.code || ''} ${error.message}`.trim() };
  }
}

async function recordLedger(client, file, result) {
  await client.query(
    'INSERT INTO ops.aigas_migration_ledger(filename,sha256,duration_ms,status,detail) VALUES($1,$2,$3,$4,$5) ON CONFLICT (filename) DO NOTHING',
    [file.name, file.sha256, result.duration_ms, result.status, result.detail ?? null]);
}

async function phase(name, baseline, order, files) {
  const database = `p02_${name}`;
  await createDatabase(database);
  const ledger = [];
  await withClient(database, async client => {
    for (const key of [...baseline, ...order]) {
      const file = files.find(f => f.key === key);
      if (!file) throw new Error(`missing migration ${key}`);
      const result = await applyFile(client, file);
      await recordLedger(client, file, result);
      ledger.push({ file: file.name, sha256: file.sha256, historical: file.historical === true, ...result });
    }
  });
  const recorded = await withClient(database, async client =>
    (await client.query('SELECT filename, sha256, duration_ms, status FROM ops.aigas_migration_ledger ORDER BY filename')).rows);
  evidence.phases[name] = { database, ledger, ledgerRows: recorded };
  return { database, ledger };
}

async function posture(database) {
  return withClient(database, async client => {
    const rows = async sql => (await client.query(sql)).rows;
    return {
      tables: await rows(`SELECT c.relname, c.relrowsecurity AS rls, c.relforcerowsecurity AS force
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%' ORDER BY 1`),
      clientGrants: (await rows(`SELECT count(*)::int AS n FROM information_schema.role_table_grants
        WHERE table_schema='public' AND grantee IN ('authenticated','anonymous')`))[0].n,
      runtimeRole: (await rows(`SELECT rolsuper, rolbypassrls, rolcanlogin, rolinherit FROM pg_roles WHERE rolname='aigas_runtime'`))[0] || null,
      policies: await rows(`SELECT tablename, policyname, permissive FROM pg_policies WHERE schemaname='public' ORDER BY 1,2`),
      runtimeGrants: await rows(`SELECT table_name, string_agg(privilege_type,',' ORDER BY privilege_type) AS privs
        FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee='aigas_runtime'
        GROUP BY table_name ORDER BY 1`),
      functionPrivileges: await rows(`SELECT p.proname, p.prosecdef,
          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
          has_function_privilege('anonymous', p.oid, 'EXECUTE') AS anonymous_can_execute
        FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='public' AND p.proname LIKE 'aigas\\_%' ORDER BY 1`),
      ledgerTriggers: await rows(`SELECT t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
        JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND NOT t.tgisinternal
          AND t.tgname IN ('aigas_ld_events_chain_guard','aigas_ld_events_append_only','aigas_ld_events_no_truncate') ORDER BY 1`),
      ledgerConstraint: (await rows(`SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname='aigas_ld_events_check'`))[0]?.def ?? null,
      defaultAcl: await rows(`SELECT defaclobjtype, defaclacl::text AS acl FROM pg_default_acl ORDER BY 1`),
      publicFunctionCount: (await rows(`SELECT count(*)::int AS n FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'`))[0].n,
    };
  });
}

async function expectFailure(database, file, label, expectRejected = true) {
  const outcome = await withClient(database, async client => {
    const started = Date.now();
    try {
      await client.query(file.body);
      return { rejected: false, duration_ms: Date.now() - started };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      return { rejected: true, duration_ms: Date.now() - started, code: error.code, message: error.message };
    }
  });
  const entry = { case: label, file: file.name, ...outcome, ok: outcome.rejected === expectRejected };
  evidence.negative.push(entry);
  return entry;
}

async function main() {
  const files = await migrationFiles();
  await bootstrapCluster();
  const byKey = key => files.find(f => f.key === key);

  const freshKeys = freshOrder(files);
  const fresh = await phase('fresh', [], freshKeys, files);
  evidence.postures.fresh = await posture(fresh.database);

  const guards = await phase('guards', GUARD_BASELINE, GUARD_ORDER, files);
  evidence.postures.guards = await posture(guards.database);

  // Out-of-order refusal, observed on a database that has 0018+0022 but not 0025.
  await expectFailure(guards.database, byKey('0027'), '0027 refuses to run before 0025');
  evidence.phases.guardsAfterFailure = {
    ledger: (await withClient(guards.database, c => c.query('SELECT filename, status FROM ops.aigas_migration_ledger ORDER BY filename'))).rows,
  };
  // Complete the guards database so post-0025 suppression can be observed.
  for (const key of ['0025', '0026', '0027', '0028', '0029', '0030', '0024']) {
    await withClient(guards.database, async client => {
      const result = await applyFile(client, byKey(key));
      await recordLedger(client, byKey(key), result);
      return result;
    });
  }
  evidence.postures.guardsComplete = await posture(guards.database);
  await expectFailure(guards.database, byKey('0019'), '0019 refuses to run after 0025');
  await expectFailure(guards.database, byKey('0018'), '0018 refuses to run after 0025');
  await expectFailure(guards.database, byKey('0016'), '0016 replay is refused (CREATE FUNCTION is not idempotent)');
  await expectFailure(guards.database, byKey('0017'), '0017 replay is refused (ADD COLUMN is not idempotent)');
  await expectFailure(guards.database, byKey('0029'), '0029 replay is refused (constraint already exists)');
  // 0013 is deliberately replayable: it drops and recreates the ledger constraint.
  await expectFailure(guards.database, byKey('0013'), '0013 replay is accepted (idempotent DROP CONSTRAINT IF EXISTS)', false);

  const delta = await phase('delta', DELTA_BASELINE, DELTA_ORDER, files);
  evidence.postures.delta = await posture(delta.database);

  // Chain-guard behaviour on the repaired delta database: a forged link must fail,
  // and a well-formed genesis row must be accepted so the guard is not simply broken.
  evidence.negative.push(await withClient(delta.database, async client => {
    const tenant = '11111111-1111-4111-8111-111111111111';
    const actor = '44444444-4444-4444-8444-444444444444';
    await client.query(`INSERT INTO neon_auth."user"(id,name,email) VALUES($1,'Synthetic Actor','actor@example.test') ON CONFLICT DO NOTHING`, [actor]);
    await client.query(`INSERT INTO public.aigas_tenants(id,name) VALUES($1,'synthetic') ON CONFLICT DO NOTHING`, [tenant]);
    await client.query(`INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,'OWNER') ON CONFLICT DO NOTHING`, [tenant, actor]);
    const attempt = async (label, sql) => {
      await client.query('BEGIN');
      try { await client.query(sql); await client.query('ROLLBACK'); return { case: label, rejected: false }; }
      catch (error) { await client.query('ROLLBACK').catch(() => {}); return { case: label, rejected: true, code: error.code, message: error.message }; }
    };
    const forged = await attempt('ledger chain guard rejects a sequence gap (sequence_no=5, no parent)',
      `INSERT INTO public.aigas_ld_events(event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,hash_profile,sequence_no,idempotency_key,integrity_hash,previous_hash)
       VALUES(gen_random_uuid(),'${tenant}','kernel','kernel.audit.recorded','p','{"synthetic":false,"audit_ref":"22222222-2222-4222-8222-222222222222","action":"kernel.test"}',now(),'${actor}','aigas-ledger-sha256-chain-v2',5,'forged',repeat('a',64),repeat('b',64))`);
    const genesis = await attempt('ledger chain guard accepts a consistent genesis row (sequence_no=1, null previous_hash)',
      `INSERT INTO public.aigas_ld_events(event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,hash_profile,sequence_no,idempotency_key,integrity_hash,previous_hash)
       VALUES(gen_random_uuid(),'${tenant}','kernel','kernel.audit.recorded','p','{"synthetic":false,"audit_ref":"33333333-3333-4333-8333-333333333333","action":"kernel.test"}',now(),'${actor}','aigas-ledger-sha256-chain-v2',1,'genesis',repeat('c',64),NULL)`);
    return { paired: true, forged, genesis, ok: forged.rejected === true && genesis.rejected === false };
  }));

  // 0016 SECURITY DEFINER review: EXECUTE must not reach client roles after 0018/0025.
  evidence.negative.push({
    case: 'aigas_sc_usage_window_v2 is not executable by authenticated/anonymous after 0025',
    rejected: evidence.postures.delta.functionPrivileges
      .filter(p => p.proname === 'aigas_sc_usage_window_v2')
      .every(p => p.authenticated_can_execute === false && p.anonymous_can_execute === false),
    ok: evidence.postures.delta.functionPrivileges
      .filter(p => p.proname === 'aigas_sc_usage_window_v2')
      .every(p => p.authenticated_can_execute === false && p.anonymous_can_execute === false),
    detail: evidence.postures.delta.functionPrivileges.filter(p => p.proname === 'aigas_sc_usage_window_v2'),
  });

  // 0016 applied alone inherits the owner default ACL: EXECUTE reaches authenticated.
  // Recorded as a real finding, not as a failure of the rehearsal.
  const probe = 'p02_probe0016';
  await createDatabase(probe);
  const probeState = await withClient(probe, async client => {
    for (const key of [...DELTA_BASELINE, '0013', '0014', '0016']) {
      await applyFile(client, byKey(key));
    }
    return (await client.query(`SELECT has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
        p.prosecdef, pg_get_userbyid(p.proowner) AS owner
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='aigas_sc_usage_window_v2'`)).rows[0];
  });
  evidence.findings = [{
    id: 'SECDEF-0016-ACL',
    severity: probeState?.authenticated_can_execute ? 'medium' : 'none',
    status: probeState?.authenticated_can_execute ? 'OPEN' : 'CLOSED',
    detail: probeState?.authenticated_can_execute
      ? '0016 leaves EXECUTE reachable by authenticated through the owner default ACL.'
      : '0016 revokes EXECUTE from PUBLIC, authenticated and anonymous, so the SECURITY DEFINER aggregate is not reachable by a client role even before 0018/0025 runs.',
    evidence: probeState,
  }];

  // B9 regression: a project with neither the Data API nor Neon Auth has no
  // authenticated/anonymous role. 0018 and 0025 used to abort with 42704 on that
  // shape and stop the whole chain; the to_regrole guard must let a full fresh
  // install complete. Roles are cluster-scoped, so this runs after the other
  // phase databases are dropped.
  await resetCluster();
  const dropErrors = await withClient('postgres', async client => {
    const errors = [];
    for (const role of ['authenticated', 'anonymous']) {
      try { await client.query(`DROP ROLE IF EXISTS ${role}`); }
      catch (error) { errors.push(`${role}: ${error.code} ${error.message.split('\n')[0]}`); }
    }
    return errors;
  }, 'bootstrap_admin');
  const noRoles = await phase('client_roles_absent', [], freshKeys, files);
  evidence.postures.noClientRoles = await withClient(noRoles.database, async client => {
    const rows = async sql => (await client.query(sql)).rows;
    return {
      dropErrors,
      authenticatedExists: (await rows(`SELECT count(*)::int AS n FROM pg_roles WHERE rolname='authenticated'`))[0].n > 0,
      anonymousExists: (await rows(`SELECT count(*)::int AS n FROM pg_roles WHERE rolname='anonymous'`))[0].n > 0,
      tables: (await rows(`SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%'`))[0].n,
      policies: (await rows(`SELECT count(*)::int AS n FROM pg_policies WHERE schemaname='public'`))[0].n,
      runtimeRole: (await rows(`SELECT rolsuper, rolbypassrls, rolcanlogin, rolinherit FROM pg_roles WHERE rolname='aigas_runtime'`))[0] || null,
      ledgerTriggers: await rows(`SELECT t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
        JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND NOT t.tgisinternal
          AND t.tgname IN ('aigas_ld_events_chain_guard','aigas_ld_events_append_only','aigas_ld_events_no_truncate') ORDER BY 1`),
      appliedRows: (await rows(`SELECT count(*)::int AS n FROM ops.aigas_migration_ledger WHERE status='APPLIED'`))[0].n,
    };
  });
  const noRolesApplied = noRoles.ledger.filter(l => l.status === 'APPLIED').length;
  evidence.negative.push({
    case: '0018/0025 complete a fresh install with no authenticated/anonymous roles',
    rejected: noRolesApplied === freshKeys.length,
    ok: noRolesApplied === freshKeys.length && dropErrors.length === 0,
    detail: {
      applied: noRolesApplied,
      expected: freshKeys.length,
      failed: noRoles.ledger.filter(l => l.status !== 'APPLIED').map(l => `${l.file}: ${l.detail}`),
      posture: evidence.postures.noClientRoles,
    },
  });

  evidence.files = files.map(({ key, name, sha256, historical: h }) => ({ key, name, sha256, historical: h === true }));
  const refSha = process.env.P02_REF_SHA || null;
  evidence.reference = { referenceSha: refSha, headSha: (await run('git', ['-C', ROOT, 'rev-parse', 'HEAD'])).out.trim() };
  evidence.result = evidence.negative.every(n => n.ok === true) ? 'PASS' : 'FAIL';
  evidence.workDir = WORK;

  if (jsonPath) {
    await mkdir(join(jsonPath, '..'), { recursive: true });
    await writeFile(jsonPath, JSON.stringify(evidence, null, 2));
  }
  console.log(JSON.stringify({
    result: evidence.result,
    serverVersion: evidence.serverVersion,
    fresh: evidence.phases.fresh.ledger.map(l => `${l.file}:${l.status}`),
    delta: evidence.phases.delta.ledger.map(l => `${l.file}:${l.status}`),
    negative: evidence.negative.map(n => ({ case: n.case, ok: n.ok, rejected: n.rejected })),
    findings: evidence.findings,
  }, null, 2));

  if (!keep) {
    await run(join(PGBIN, 'pg_ctl'), ['-D', DATA, '-m', 'immediate', 'stop']);
    await rm(DATA, { recursive: true, force: true });
    await rm(SOCK, { recursive: true, force: true });
    await rm(WORK, { recursive: true, force: true });
  }
}

await main().catch(async error => {
  console.error(error.message);
  process.exitCode = 1;
  if (!keep) await run(join(PGBIN, 'pg_ctl'), ['-D', DATA, '-m', 'immediate', 'stop']).catch(() => {});
});
