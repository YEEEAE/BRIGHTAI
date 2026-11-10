// P03 — Runtime RLS / Data-API matrix on a disposable local PostgreSQL 18 cluster.
//
// Proves, with executed statements, the DB04–DB07 acceptance criteria:
//   DB04 the connection role is not the table owner and not BYPASSRLS
//   DB05 two tenants, a non-member identity, and GUC switching across every CRUD verb
//   DB06 client roles (authenticated/anonymous) have zero object and function access
//   DB07 Secure Chat content is participant-only, including in front of a non-participant ADMIN
//
// No network. The cluster is created under TMPDIR, listens on a unix socket only,
// and is destroyed at the end unless --keep is passed. Nothing here reads .env or
// touches Neon/production.
//
// Usage: node scripts/verify-runtime-rls.mjs [--keep] [--json <path>]

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import pg from 'pg';
import { freshOrder } from './migration-order.mjs';

const run = promisify(execFile);
const PGBIN = process.env.P03_PG_BIN || '/opt/homebrew/opt/postgresql@18/bin';
const ROOT = new URL('..', import.meta.url).pathname;
const WORK = join(process.env.TMPDIR || tmpdir(), 'p03-runtime-rls');
const DATA = join(WORK, 'data');
const SOCK = join(WORK, 'sock');
const PORT = '5443';
const DB = 'p03_matrix';
const ADMIN = 'p03_admin';
const keep = process.argv.includes('--keep');
const jsonPath = process.argv.indexOf('--json') > -1 ? process.argv[process.argv.indexOf('--json') + 1] : null;

const A = 'aaaaaaaa-0000-4000-8000-00000000000a';
const B = 'bbbbbbbb-0000-4000-8000-00000000000b';
const OWNER_A = '11111111-1111-4111-8111-111111111111';
const MEMBER_A = '22222222-2222-4222-8222-222222222222';
const ADMIN_A = '33333333-3333-4333-8333-333333333333'; // manager, not a chat participant
const OWNER_B = '44444444-4444-4444-8444-444444444444';
const OUTSIDER = '55555555-5555-4555-8555-555555555555'; // no membership at all
const CONV_A = '66666666-6666-4666-8666-666666666666';
const CONV_B = '77777777-7777-4777-8777-777777777777';

const results = [];
const sections = {};
const step = name => process.stderr.write(`[p03] ${name} ${new Date().toISOString()}\n`);

function record(area, id, expectation, outcome, passed, detail) {
  results.push({ area, id, expectation, outcome, passed, detail: detail ?? null });
  if (!passed) process.stderr.write(`FAIL ${area}/${id}: ${expectation} -> ${JSON.stringify(outcome)}\n`);
}

async function pgctl(...args) {
  return run(join(PGBIN, 'pg_ctl'), ['-D', DATA, ...args]);
}

async function admin(database = DB, user = ADMIN) {
  const client = new pg.Client({ host: SOCK, port: Number(PORT), user, database });
  await client.connect();
  return client;
}

async function bootstrap() {
  await mkdir(SOCK, { recursive: true });
  if (!existsSync(join(DATA, 'PG_VERSION'))) {
    await run(join(PGBIN, 'initdb'), ['-D', DATA, '-U', ADMIN, '-A', 'trust', '--locale=C', '--encoding=UTF8']);
  }
  try {
    await run(join(PGBIN, 'pg_ctl'), ['-D', DATA, '-l', join(WORK, 'postgres.log'), '-o',
      `-k ${SOCK} -c listen_addresses= -p ${PORT} -c fsync=off -c full_page_writes=off`,
      '-w', 'start']);
  } catch (error) {
    if (!/already running/.test(String(error.stderr || error.message))) throw error;
  }

  const client = await admin('postgres');
  step('bootstrap:connected');
  try {
    // Mirror the live Neon role posture read on 2026-11-10. 0025 fails at CREATE ROLE
    // if these attributes differ, and the default ACL is what makes the 0018/0025
    // revokes meaningful instead of untested no-ops.
    const roles = [
      ['neondb_owner', 'LOGIN NOSUPERUSER INHERIT CREATEROLE CREATEDB REPLICATION BYPASSRLS'],
      ['neon_superuser', 'NOLOGIN NOSUPERUSER INHERIT CREATEROLE CREATEDB REPLICATION BYPASSRLS'],
      ['cloud_admin', 'LOGIN SUPERUSER INHERIT CREATEROLE CREATEDB REPLICATION BYPASSRLS'],
      ['neon_auth', 'LOGIN NOSUPERUSER NOINHERIT'],
      ['authenticated', 'NOLOGIN NOSUPERUSER INHERIT'],
      ['anonymous', 'NOLOGIN NOSUPERUSER INHERIT'],
      ['authenticator', 'LOGIN NOSUPERUSER NOINHERIT'],
      ['p03_content_probe', 'NOLOGIN NOSUPERUSER INHERIT'],
      ['p03_runtime_login', 'LOGIN NOSUPERUSER NOINHERIT NOBYPASSRLS NOCREATEROLE'],
    ];
    for (const [name, attrs] of roles) {
      if (!(await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [name])).rowCount) {
        await client.query(`CREATE ROLE ${name} ${attrs}`);
      }
    }
    await client.query('GRANT neon_superuser, authenticated, anonymous, neon_auth TO neondb_owner');
    await client.query('GRANT authenticated, anonymous TO authenticator');
    if ((await client.query("SELECT count(*)::int AS n FROM pg_database WHERE datname=$1", [DB])).rows[0].n === 0) {
      await client.query(`CREATE DATABASE ${DB} OWNER neondb_owner`);
    }
    sections.serverVersion = (await client.query('SHOW server_version')).rows[0].server_version;
  } finally { await client.end(); }

  const db = await admin();
  try {
    await db.query(`
      ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
      ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT USAGE ON SEQUENCES TO anonymous;`);
    await db.query('CREATE SCHEMA IF NOT EXISTS neon_auth AUTHORIZATION neon_auth');
    const has = (await db.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='neon_auth'")).rows[0].n;
    if (has === 0) {
      await db.query(`
        SET ROLE neon_auth;
        CREATE TABLE neon_auth."user" (id uuid PRIMARY KEY, name text NOT NULL DEFAULT 'Synthetic User', email text NOT NULL DEFAULT 'synthetic@example.test', banned boolean, role text, "emailVerified" boolean);
        CREATE TABLE neon_auth.organization (id uuid PRIMARY KEY, name text);
        CREATE TABLE neon_auth.invitation (id uuid PRIMARY KEY, email text, status text, "expiresAt" timestamptz, "organizationId" uuid, "inviterId" uuid, role text);
        CREATE TABLE neon_auth.member (id uuid PRIMARY KEY, "organizationId" uuid, "userId" uuid, role text);
        RESET ROLE;`);
    }
    const publicTables = (await db.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'")).rows[0].n;
    sections.freshDatabase = publicTables === 0 && has === 0;
  } finally { await db.end(); }
}

async function applyMigrations() {
  const directory = new URL('../migrations/', import.meta.url);
  const names = (await readdir(directory)).filter(f => f.endsWith('.sql')).sort();
  const byKey = new Map(names.map(name => [name.slice(0, 4), name]));
  const order = freshOrder(names.map(name => ({ key: name.slice(0, 4), file: name, historical: false })));
  const applied = [];
  const client = await admin(DB, 'neondb_owner');
  try {
    for (const key of order) {
      const file = byKey.get(key);
      const started = Date.now();
      try {
        await client.query(await readFile(new URL(file, directory), 'utf8'));
        applied.push({ file, ms: Date.now() - started, status: 'APPLIED' });
      } catch (error) {
        applied.push({ file, ms: Date.now() - started, status: 'FAILED', code: error.code, message: error.message.split('\n')[0] });
        throw error;
      }
    }
  } finally { await client.end(); }
  sections.migrations = { count: applied.length, applied };
  // Operational step from P02 §3.11, mirrored locally so SET LOCAL ROLE works the
  // same way it does on the isolated Neon target. Cluster-scoped, disposable.
  const fix = await admin();
  try {
    await fix.query('GRANT aigas_runtime TO p03_runtime_login WITH INHERIT FALSE, SET TRUE');
    await fix.query('GRANT p03_content_probe TO neondb_owner WITH INHERIT FALSE, SET TRUE');
    await fix.query('GRANT aigas_runtime TO neondb_owner WITH INHERIT FALSE, SET TRUE');
    await fix.query('GRANT authenticated TO neondb_owner WITH INHERIT FALSE, SET TRUE');
    await fix.query('GRANT anonymous TO neondb_owner WITH INHERIT FALSE, SET TRUE');
  } finally { await fix.end(); }
}

async function seed() {
  const client = await admin(DB, 'neondb_owner');
  try {
    const users = [
      [OWNER_A, 'Synthetic Owner A', 'owner-a@example.invalid'],
      [MEMBER_A, 'Synthetic Member A', 'member-a@example.invalid'],
      [ADMIN_A, 'Synthetic Admin A', 'admin-a@example.invalid'],
      [OWNER_B, 'Synthetic Owner B', 'owner-b@example.invalid'],
      [OUTSIDER, 'Synthetic Outsider', 'outsider@example.invalid'],
    ];
    for (const [id, name, email] of users) {
      await client.query('INSERT INTO neon_auth."user"(id,name,email,"emailVerified") VALUES($1,$2,$3,false)', [id, name, email]);
    }
    await client.query("INSERT INTO aigas_tenants(id,name) VALUES($1,'Synthetic Tenant A'),($2,'Synthetic Tenant B')", [A, B]);
    for (const [tenant, user, role] of [[A, OWNER_A, 'OWNER'], [A, MEMBER_A, 'MEMBER'], [A, ADMIN_A, 'ADMIN'], [B, OWNER_B, 'OWNER']]) {
      await client.query('INSERT INTO aigas_memberships(tenant_id,user_id,role) VALUES($1,$2,$3)', [tenant, user, role]);
    }
    await client.query(`INSERT INTO aigas_fw_rules(id,tenant_id,name,pattern,action,priority)
      VALUES(gen_random_uuid(),$1,'synthetic-a','x','ALLOW',1),(gen_random_uuid(),$2,'synthetic-b','x','ALLOW',1)`, [A, B]);
    await client.query(`INSERT INTO aigas_fw_decisions(id,tenant_id,action,reason,mode)
      VALUES(gen_random_uuid(),$1,'ALLOW','NO_MATCH_LAB_ONLY','LAB'),(gen_random_uuid(),$2,'ALLOW','NO_MATCH_LAB_ONLY','LAB')`, [A, B]);
    await client.query(`INSERT INTO aigas_audit_events(id,tenant_id,actor_user_id,action)
      VALUES(gen_random_uuid(),$1,$2,'workspace.created'),(gen_random_uuid(),$3,$4,'workspace.created')`, [A, OWNER_A, B, OWNER_B]);
    await client.query(`INSERT INTO aigas_product_access(tenant_id,product_slug,status)
      VALUES($1,'secure-chat','ENABLED'),($2,'secure-chat','ENABLED')`, [A, B]);
    await client.query(`INSERT INTO aigas_product_grants(tenant_id,product_slug,approval_reference,expires_at)
      VALUES($1,'secure-chat','SYNTHETIC-FIXTURE',now()+interval '1 day'),($2,'secure-chat','SYNTHETIC-FIXTURE',now()+interval '1 day')`, [A, B]);
    // Chat content: MEMBER_A authored one conversation+both messages, OWNER_A authored another.
    await client.query(`INSERT INTO aigas_sc_conversations(tenant_id,user_id,id,expires_at,retention_policy_ref,opt_in_at)
      VALUES($1,$2,$3,now()+interval '1 day','synthetic-retention',now()),
            ($1,$4,$5,now()+interval '1 day','synthetic-retention',now())`, [A, MEMBER_A, CONV_A, OWNER_A, CONV_B]);
    await client.query(`INSERT INTO aigas_sc_messages(tenant_id,user_id,conversation_id,id,model_ref,role,content)
      VALUES($1,$2,$3,gen_random_uuid(),'synthetic-model','user','member-a-secret'),
            ($1,$4,$5,gen_random_uuid(),'synthetic-model','user','owner-a-secret')`, [A, MEMBER_A, CONV_A, OWNER_A, CONV_B]);
    // Content probe: no production role gets this. It exists only to evaluate the
    // participant-only predicate, which is otherwise masked by the grant deny.
    await client.query('GRANT USAGE ON SCHEMA public TO p03_content_probe');
    await client.query('GRANT SELECT, INSERT ON public.aigas_sc_conversations, public.aigas_sc_messages TO p03_content_probe');
  } finally { await client.end(); }
}

// Run `work` inside a transaction as `role`, always rolled back.
async function as(role, work) {
  const client = await admin(DB, 'neondb_owner');
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL ROLE ${role}`);
    const value = await work(client);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, code: error.code, message: error.message.split('\n')[0] };
  } finally {
    await client.query('ROLLBACK').catch(() => {});
    await client.end();
  }
}

function scope(client, tenant, user) {
  return client.query("SELECT set_config('aigas.tenant_id',$1,true), set_config('aigas.user_id',$2,true)", [tenant, user]);
}

// ---------------------------------------------------------------- structural
async function structural() {
  const client = await admin(DB, 'neondb_owner');
  try {
    const q = async (sql, params) => (await client.query(sql, params)).rows;

    sections.owner = await q(`
      SELECT current_user AS role, r.rolsuper, r.rolbypassrls, r.rolcreaterole, r.rolcanlogin
      FROM pg_roles r WHERE r.rolname = current_user`);
    const owners = await q(`
      SELECT pg_get_userbyid(c.relowner) AS owner, count(*)::int AS tables
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%'
      GROUP BY 1 ORDER BY 2 DESC`);
    sections.tableOwners = owners;
    const ownedByRuntime = await q(`
      SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%'
        AND pg_get_userbyid(c.relowner)='aigas_runtime'`);
    record('DB04', 'runtime-owns-no-table', 'aigas_runtime owns 0 of the AIGAS tables',
      { owned: ownedByRuntime[0].n }, ownedByRuntime[0].n === 0);

    const runtime = (await q(`SELECT rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolreplication, rolcanlogin, rolinherit
      FROM pg_roles WHERE rolname='aigas_runtime'`))[0];
    sections.runtimeRole = runtime;
    const least = runtime && !runtime.rolsuper && !runtime.rolbypassrls && !runtime.rolcreaterole
      && !runtime.rolcreatedb && !runtime.rolreplication && !runtime.rolcanlogin;
    record('DB04', 'runtime-least-privilege', 'aigas_runtime: NOBYPASSRLS NOSUPERUSER NOCREATEROLE NOLOGIN',
      runtime ?? null, Boolean(least));

    const memberships = await q(`
      SELECT parent.rolname AS granted_role, m.inherit_option, m.set_option, m.admin_option
      FROM pg_auth_members m
      JOIN pg_roles parent ON parent.oid=m.roleid
      JOIN pg_roles member ON member.oid=m.member
      WHERE member.rolname='aigas_runtime' ORDER BY 1`);
    sections.runtimeMemberships = memberships;
    record('DB04', 'runtime-no-privileged-membership',
      'aigas_runtime is not a member of an owner/BYPASSRLS/client role',
      memberships, memberships.every(m => !['neondb_owner', 'neon_superuser', 'cloud_admin', 'authenticated', 'anonymous'].includes(m.granted_role)));

    const rls = await q(`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
             (SELECT count(*)::int FROM pg_policy p WHERE p.polrelid=c.oid) AS policies
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%' ORDER BY 1`);
    sections.rls = rls;
    record('DB04', 'rls-enabled-all', 'RLS enabled on every AIGAS table',
      { tables: rls.length, missing: rls.filter(r => !r.relrowsecurity).map(r => r.relname) },
      rls.length > 0 && rls.every(r => r.relrowsecurity));
    record('DB04', 'force-only-content', 'FORCE RLS exactly on the two Secure Chat content tables',
      rls.filter(r => r.relforcerowsecurity).map(r => r.relname),
      rls.filter(r => r.relforcerowsecurity).map(r => r.relname).sort().join(',') === 'aigas_sc_conversations,aigas_sc_messages');
    record('DB04', 'runtime-not-owner-means-rls-applies',
      'runtime is not the owner, so ENABLE (not FORCE) is enough to bind it',
      { owner: owners[0]?.owner, runtimeTables: ownedByRuntime[0].n },
      owners[0]?.owner === 'neondb_owner' && ownedByRuntime[0].n === 0);

    // has_table_privilege folds in direct grants and role membership; PUBLIC is not a
    // role, so it is tested through the ACL itself. Both paths matter: a PUBLIC grant
    // would be inherited by every client role.
    const roleGrantRows = await q(`
      SELECT role, c.relname,
        array_remove(ARRAY[
          CASE WHEN has_table_privilege(role, c.oid, 'SELECT') THEN 'SELECT' END,
          CASE WHEN has_table_privilege(role, c.oid, 'INSERT') THEN 'INSERT' END,
          CASE WHEN has_table_privilege(role, c.oid, 'UPDATE') THEN 'UPDATE' END,
          CASE WHEN has_table_privilege(role, c.oid, 'DELETE') THEN 'DELETE' END,
          CASE WHEN has_table_privilege(role, c.oid, 'TRUNCATE') THEN 'TRUNCATE' END,
          CASE WHEN has_table_privilege(role, c.oid, 'REFERENCES') THEN 'REFERENCES' END,
          CASE WHEN has_table_privilege(role, c.oid, 'TRIGGER') THEN 'TRIGGER' END
        ], NULL) AS verbs
      FROM unnest(ARRAY['authenticated','anonymous']::text[]) AS role
      CROSS JOIN (SELECT c.oid, c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%') c`);
    const publicTableGrantRows = await q(`
      SELECT 'PUBLIC'::text AS role, c.relname,
        array_agg(DISTINCT a.privilege_type ORDER BY a.privilege_type) AS verbs
      FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      CROSS JOIN LATERAL aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
      WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%' AND a.grantee=0
      GROUP BY c.relname`);
    const clientGrants = [...roleGrantRows, ...publicTableGrantRows].filter(r => (r.verbs ?? []).length > 0);
    sections.clientTableGrants = clientGrants;
    record('DB06', 'client-zero-table-grants', 'authenticated/anonymous/PUBLIC hold zero table privileges in public',
      clientGrants, clientGrants.length === 0);

    const seqGrants = await q(`
      SELECT role, c.relname FROM unnest(ARRAY['authenticated','anonymous']::text[]) AS role
      CROSS JOIN (SELECT c.oid, c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind='S') c
      WHERE has_sequence_privilege(role, c.oid, 'USAGE') OR has_sequence_privilege(role, c.oid, 'UPDATE')
      UNION ALL
      SELECT 'PUBLIC', c.relname FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      CROSS JOIN LATERAL aclexplode(coalesce(c.relacl, acldefault('S', c.relowner))) a
      WHERE n.nspname='public' AND c.relkind='S' AND a.grantee=0`);
    sections.clientSequenceGrants = seqGrants;
    record('DB06', 'client-zero-sequence-grants', 'client roles hold no sequence privilege in public',
      seqGrants, seqGrants.length === 0);
    const funcs = await q(`
      SELECT p.oid::regprocedure::text AS signature, p.prosecdef,
             has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
             has_function_privilege('anonymous', p.oid, 'EXECUTE') AS anonymous,
             has_function_privilege('aigas_runtime', p.oid, 'EXECUTE') AS runtime
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' ORDER BY 1`);
    // PUBLIC is implicitly executable when no explicit PUBLIC grant was revoked; the
    // per-role flags above already fold that path in (authenticated/anonymous inherit it).
    sections.functions = funcs;
    record('DB06', 'client-zero-function-execute', 'authenticated/anonymous cannot EXECUTE any public function',
      funcs.filter(f => f.authenticated || f.anonymous).map(f => f.signature),
      funcs.length > 0 && funcs.every(f => !f.authenticated && !f.anonymous));
    const definer = funcs.filter(f => f.prosecdef).map(f => f.signature);
    sections.securityDefiner = definer;
    record('DB06', 'definer-not-client-callable', 'SECURITY DEFINER helpers are not executable by client roles',
      definer, definer.length > 0 && funcs.filter(f => f.prosecdef).every(f => !f.authenticated && !f.anonymous));

    const defaultAcl = await q(`
      SELECT pg_get_userbyid(d.defaclrole) AS owner, d.defaclobjtype AS obj,
             array_to_string(d.defaclacl, ' | ') AS acl
      FROM pg_default_acl d ORDER BY 1,2`);
    sections.defaultAcl = defaultAcl;
    const clientDefault = defaultAcl.filter(d => /authenticated|anonymous/.test(d.acl ?? ''));
    record('DB06', 'no-client-default-acl', 'no default ACL grants client roles future access',
      clientDefault, clientDefault.length === 0);

    const restrictive = await q(`
      SELECT tablename, policyname, permissive FROM pg_policies
      WHERE schemaname='public' AND policyname='aigas_client_deny' ORDER BY 1`);
    record('DB06', 'client-deny-restrictive', 'aigas_client_deny is RESTRICTIVE on every AIGAS table',
      { count: restrictive.length, nonRestrictive: restrictive.filter(p => p.permissive !== 'RESTRICTIVE').map(p => p.tablename) },
      restrictive.length === rls.length && restrictive.every(p => p.permissive === 'RESTRICTIVE'));

    // Every tenant-bearing table needs a runtime policy; tables without tenant_id must
    // stay deny-all rather than inherit an accidental permissive policy.
    const coverage = await q(`
      SELECT c.relname, EXISTS (SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema='public' AND col.table_name=c.relname AND col.column_name='tenant_id') AS has_tenant,
        (SELECT count(*)::int FROM pg_policy p WHERE p.polrelid=c.oid AND p.polpermissive) AS permissive
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%' ORDER BY 1`);
    sections.policyCoverage = coverage;
    const uncovered = coverage.filter(r => r.has_tenant && r.permissive === 0 && !['aigas_sc_conversations', 'aigas_sc_messages'].includes(r.relname));
    record('DB05', 'permissive-policy-per-tenant-table', 'every tenant table has a permissive policy (content tables excepted)',
      uncovered.map(r => r.relname), uncovered.length === 0);

    // Exact verb matrix that 0025 §3 promises, compared against the catalog.
    const readOnly = ['aigas_product_grants','aigas_ld_evidence_requirements','aigas_trial_requests','aigas_trial_entitlements'];
    const appendOnly = ['aigas_audit_events','aigas_ld_events','aigas_kernel_policy_decisions','aigas_fw_decisions',
      'aigas_hg_decisions','aigas_hg_events','aigas_department_events','aigas_policy_approvals',
      'aigas_re_asset_revisions','aigas_re_treatment_revisions','aigas_sc_cancellations','aigas_trial_events'];
    const selectInsert = ['aigas_auth_organizations'];
    const selectInsertUpdate = ['aigas_sc_requests','aigas_hg_requests','aigas_re_assets','aigas_policies',
      'aigas_policy_versions','aigas_policy_delegations','aigas_departments','aigas_product_access','aigas_member_invitations'];
    const contentTables = ['aigas_sc_conversations','aigas_sc_messages'];
    const expected = (table) => {
      if (contentTables.includes(table)) return [];
      if (readOnly.includes(table)) return ['SELECT'];
      if (appendOnly.includes(table)) return ['SELECT','INSERT'];
      if (selectInsert.includes(table)) return ['SELECT','INSERT'];
      if (selectInsertUpdate.includes(table)) return ['SELECT','INSERT','UPDATE'];
      if (table === 'aigas_tenants') return ['SELECT','UPDATE'];
      return ['SELECT','INSERT','UPDATE','DELETE'];
    };
    const actual = await q(`
      SELECT c.relname,
        array_remove(ARRAY[
          CASE WHEN has_table_privilege('aigas_runtime', c.oid, 'SELECT') THEN 'SELECT' END,
          CASE WHEN has_table_privilege('aigas_runtime', c.oid, 'INSERT') THEN 'INSERT' END,
          CASE WHEN has_table_privilege('aigas_runtime', c.oid, 'UPDATE') THEN 'UPDATE' END,
          CASE WHEN has_table_privilege('aigas_runtime', c.oid, 'DELETE') THEN 'DELETE' END,
          CASE WHEN has_table_privilege('aigas_runtime', c.oid, 'TRUNCATE') THEN 'TRUNCATE' END
        ], NULL) AS verbs
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\_%' ORDER BY 1`);
    const drift = actual.filter(row => expected(row.relname).sort().join(',') !== (row.verbs ?? []).sort().join(','));
    sections.runtimeTableGrants = actual;
    record('DB06', 'runtime-verb-matrix-exact', 'aigas_runtime verbs match the 0025 §3 matrix on all 36 tables',
      drift, drift.length === 0);

    const contentGrants = await q(`
      SELECT grantee, privilege_type FROM information_schema.role_table_grants
      WHERE table_schema='public' AND table_name IN ('aigas_sc_conversations','aigas_sc_messages')
        AND grantee='aigas_runtime'`);
    record('DB07', 'runtime-zero-content-grants', 'aigas_runtime holds no table privilege on Secure Chat content',
      contentGrants, contentGrants.length === 0);

    sections.rowCounts = await q(`
      SELECT 'aigas_tenants' AS t, count(*)::int AS n FROM public.aigas_tenants
      UNION ALL SELECT 'aigas_memberships', count(*)::int FROM public.aigas_memberships
      UNION ALL SELECT 'aigas_sc_messages', count(*)::int FROM public.aigas_sc_messages`);
  } finally { await client.end(); }
}

// ---------------------------------------------------------------- behavioral
async function behavioral() {
  const runtimeRow = async (client, tenant, user) => {
    await scope(client, tenant, user);
    return (await client.query('SELECT tenant_id::text FROM public.aigas_fw_rules ORDER BY 1')).rows.map(r => r.tenant_id);
  };

  // No scope.
  let out = await as('aigas_runtime', async c => (await c.query('SELECT count(*)::int AS n FROM public.aigas_fw_rules')).rows[0].n);
  record('DB05', 'no-scope-zero-rows', 'runtime without tenant scope reads 0 rows', out, out.ok && out.value === 0);

  // Tenant A sees only A.
  out = await as('aigas_runtime', c => runtimeRow(c, A, MEMBER_A));
  record('DB05', 'scope-a-only', 'runtime scoped to A sees exactly tenant A rows', out,
    out.ok && out.value.every(v => v === A) && out.value.length === 1);

  // Cross-tenant explicit predicate.
  out = await as('aigas_runtime', async c => {
    await scope(c, A, MEMBER_A);
    return (await c.query('SELECT count(*)::int AS n FROM public.aigas_fw_rules WHERE tenant_id=$1', [B])).rows[0].n;
  });
  record('DB05', 'cross-tenant-read-blocked', 'explicit WHERE tenant_id=B under scope A returns 0 rows', out, out.ok && out.value === 0);

  // Cross-tenant insert.
  out = await as('aigas_runtime', async c => {
    await scope(c, A, MEMBER_A);
    return (await c.query("INSERT INTO public.aigas_fw_rules(id,tenant_id,name,pattern,action,priority) VALUES(gen_random_uuid(),$1,'cross-b','x','ALLOW',1)", [B])).rowCount;
  });
  record('DB05', 'cross-tenant-insert-blocked', 'INSERT with tenant_id=B under scope A is rejected', out, !out.ok && ['42501', 'P0001'].includes(out.code));

  // Insert into own tenant is permitted.
  out = await as('aigas_runtime', async c => {
    await scope(c, A, MEMBER_A);
    return (await c.query("INSERT INTO public.aigas_fw_rules(id,tenant_id,name,pattern,action,priority) VALUES(gen_random_uuid(),$1,'own-a','x','ALLOW',5) RETURNING id", [A])).rowCount;
  });
  record('DB05', 'own-tenant-insert-allowed', 'INSERT with tenant_id=A under scope A succeeds', out, out.ok && out.value === 1);

  // Update/delete foreign rows affect nothing.
  out = await as('aigas_runtime', async c => {
    await scope(c, A, MEMBER_A);
    return (await c.query("UPDATE public.aigas_fw_rules SET name='tampered' WHERE tenant_id=$1", [B])).rowCount;
  });
  record('DB05', 'cross-tenant-update-noop', 'UPDATE of tenant B rows under scope A affects 0 rows', out, out.ok && out.value === 0);
  out = await as('aigas_runtime', async c => {
    await scope(c, A, MEMBER_A);
    return (await c.query('DELETE FROM public.aigas_fw_rules WHERE tenant_id=$1', [B])).rowCount;
  });
  record('DB05', 'cross-tenant-delete-noop', 'DELETE of tenant B rows under scope A affects 0 rows', out, out.ok && out.value === 0);

  // Non-member identity inside a tenant it does not belong to.
  out = await as('aigas_runtime', async c => {
    await scope(c, A, OUTSIDER);
    const n = (await c.query('SELECT count(*)::int AS n FROM public.aigas_fw_rules')).rows[0].n;
    return n;
  });
  record('DB05', 'non-member-zero-rows', 'identity without membership reads 0 rows in tenant A', out, out.ok && out.value === 0);
  out = await as('aigas_runtime', async c => {
    await scope(c, A, OUTSIDER);
    return (await c.query("INSERT INTO public.aigas_fw_rules(id,tenant_id,name,pattern,action,priority) VALUES(gen_random_uuid(),$1,'outsider-write','x','ALLOW',9)", [A])).rowCount;
  });
  record('DB05', 'non-member-write-blocked', 'identity without membership cannot INSERT into tenant A', out,
    !out.ok && ['42501', 'P0001'].includes(out.code));

  // GUC switching inside one transaction: A -> B -> A.
  out = await as('aigas_runtime', async c => {
    const seen = [];
    await scope(c, A, MEMBER_A);
    seen.push((await c.query('SELECT tenant_id::text AS t FROM public.aigas_fw_rules')).rows.map(r => r.t));
    await scope(c, B, MEMBER_A); // B with a non-member actor
    seen.push((await c.query('SELECT tenant_id::text AS t FROM public.aigas_fw_rules')).rows.map(r => r.t));
    await scope(c, A, MEMBER_A);
    seen.push((await c.query('SELECT tenant_id::text AS t FROM public.aigas_fw_rules')).rows.map(r => r.t));
    return seen;
  });
  record('DB05', 'guc-switch-no-carryover', 'switching the tenant selector cannot carry tenant A rows into B',
    { result: out.ok ? out.value : out },
    out.ok && out.value[0].length === 1 && out.value[1].length === 0 && out.value[2].length === 1);

  // Actor mismatch: tenant A with the B owner as actor.
  out = await as('aigas_runtime', async c => {
    await scope(c, A, OWNER_B);
    return (await c.query('SELECT count(*)::int AS n FROM public.aigas_fw_rules')).rows[0].n;
  });
  record('DB05', 'actor-tenant-mismatch', 'tenant A + actor from B reads 0 rows', out, out.ok && out.value === 0);

  // Scope must not survive COMMIT/ROLLBACK, and must not leak between connections.
  const client = await admin();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE aigas_runtime');
    await scope(client, A, MEMBER_A);
    const inside = (await client.query('SELECT count(*)::int AS n FROM public.aigas_fw_rules')).rows[0].n;
    await client.query('COMMIT');
    const afterCommit = (await client.query("SELECT coalesce(nullif(current_setting('aigas.tenant_id',true),''),'') AS v")).rows[0].v;
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE aigas_runtime');
    const after = (await client.query('SELECT count(*)::int AS n FROM public.aigas_fw_rules')).rows[0].n;
    await client.query('ROLLBACK');
    record('DB05', 'scope-dies-with-transaction', 'scope is transaction-local and the next transaction reads 0 rows',
      { inside, afterCommit, after }, inside === 1 && afterCommit === '' && after === 0);
  } finally { await client.end(); }
  const fresh = await admin(DB, 'neondb_owner');
  try {
    const freshSetting = (await fresh.query("SELECT coalesce(current_setting('aigas.tenant_id',true),'') AS v")).rows[0].v;
    record('DB05', 'scope-not-shared-across-connections', 'a new connection starts with an empty scope', { value: freshSetting }, freshSetting === '');
  } finally { await fresh.end(); }

  // RLS cannot be switched off by the runtime role.
  out = await as('aigas_runtime', async c => {
    await c.query('SET LOCAL row_security = off');
    await scope(c, A, MEMBER_A);
    return (await c.query('SELECT count(*)::int AS n FROM public.aigas_fw_rules')).rows[0].n;
  });
  record('DB04', 'runtime-cannot-disable-rls', 'SET row_security=off does not bypass RLS for the runtime role',
    out, !out.ok);

  // Escalation attempts from a real login role, not from a superuser session.
  const wrapper = await admin(DB, 'p03_runtime_login');
  try {
    const attrs = (await wrapper.query("SELECT current_user AS role, r.rolsuper, r.rolbypassrls, r.rolinherit FROM pg_roles r WHERE r.rolname=current_user")).rows[0];
    const direct = await wrapper.query('SELECT count(*)::int AS n FROM public.aigas_fw_rules').then(v => ({ ok: true, value: v.rows[0].n })).catch(e => ({ ok: false, code: e.code }));
    record('DB04', 'runtime-login-directly-denied', 'the runtime login role holds no direct table privilege (NOINHERIT)', direct, !direct.ok && direct.code === '42501');
    // GUCs are transaction-local: outside BEGIN the implicit transaction discards them.
    await wrapper.query('BEGIN');
    await wrapper.query('SET LOCAL ROLE aigas_runtime');
    await wrapper.query("SELECT set_config('aigas.tenant_id',$1,true), set_config('aigas.user_id',$2,true)", [A, MEMBER_A]);
    const rowsA = (await wrapper.query('SELECT tenant_id::text AS t FROM public.aigas_fw_rules')).rows.map(r => r.t);
    const crossB = (await wrapper.query('SELECT count(*)::int AS n FROM public.aigas_fw_rules WHERE tenant_id=$1', [B])).rows[0].n;
    await wrapper.query('ROLLBACK');
    record('DB04', 'runtime-login-wrapper-enforces-rls', 'the login wrapper reaches only tenant A rows through SET ROLE', { rowsA, crossB }, rowsA.length === 1 && rowsA[0] === A && crossB === 0);
    const escalate = await wrapper.query('SET ROLE neondb_owner').then(() => ({ ok: true })).catch(e => ({ ok: false, code: e.code }));
    record('DB04', 'runtime-cannot-become-owner', 'the runtime login role cannot SET ROLE the owner', escalate, !escalate.ok && escalate.code === '42501');
    const escalateClient = await wrapper.query('SET ROLE authenticated').then(() => ({ ok: true })).catch(e => ({ ok: false, code: e.code }));
    record('DB06', 'runtime-cannot-become-client', 'the runtime login role cannot SET ROLE a client role', escalateClient, !escalateClient.ok && escalateClient.code === '42501');
  } finally { await wrapper.end(); }

  const authenticator = await admin(DB, 'authenticator');
  try {
    await authenticator.query('SET ROLE authenticated');
    const read = await authenticator.query('SELECT count(*)::int AS n FROM public.aigas_tenants').then(() => ({ ok: true })).catch(e => ({ ok: false, code: e.code }));
    record('DB06', 'authenticator-cannot-read', 'the Data API login role as authenticated reads no AIGAS row', read, !read.ok && read.code === '42501');
    const escalate = await authenticator.query('SET ROLE aigas_runtime').then(() => ({ ok: true })).catch(e => ({ ok: false, code: e.code }));
    record('DB06', 'client-cannot-become-runtime', 'authenticated cannot SET ROLE aigas_runtime', escalate, !escalate.ok && escalate.code === '42501');
  } finally { await authenticator.end(); }

  // CRUD verb matrix per table class (from migrations/0025 §3).
  const verbs = [
    ['aigas_fw_decisions', 'UPDATE', 'append-only: no UPDATE'],
    ['aigas_audit_events', 'DELETE', 'append-only: no DELETE'],
    ['aigas_product_grants', 'INSERT', 'read-only: no INSERT'],
    ['aigas_product_access', 'DELETE', 'select/insert/update: no DELETE'],
    ['aigas_tenants', 'INSERT', 'tenants: no INSERT (bootstrap is privileged)'],
  ];
  for (const [table, verb, expectation] of verbs) {
    out = await as('aigas_runtime', async c => {
      await scope(c, A, OWNER_A);
      if (verb === 'UPDATE') return (await c.query(`UPDATE public.${table} SET tenant_id=tenant_id WHERE tenant_id=$1`, [A])).rowCount;
      if (verb === 'DELETE') return (await c.query(`DELETE FROM public.${table} WHERE tenant_id=$1`, [A])).rowCount;
      if (table === 'aigas_tenants') return (await c.query("INSERT INTO public.aigas_tenants(id,name) VALUES($1,'impossible')", ['99999999-9999-4999-8999-999999999999'])).rowCount;
      return (await c.query(`INSERT INTO public.${table}(tenant_id,product_slug,approval_reference,expires_at) VALUES($1,'ledger','x',now())`, [A])).rowCount;
    });
    record('DB06', `verb-${table}-${verb.toLowerCase()}`, expectation, out, !out.ok && out.code === '42501');
  }

  // Membership rules: members read the roster, only managers write, never their own row.
  out = await as('aigas_runtime', async c => {
    await scope(c, A, MEMBER_A);
    return (await c.query('SELECT count(*)::int AS n FROM public.aigas_memberships')).rows[0].n;
  });
  record('DB05', 'member-sees-roster', 'a MEMBER in tenant A reads the 3-row roster', out, out.ok && out.value === 3);
  out = await as('aigas_runtime', async c => {
    await scope(c, A, MEMBER_A);
    return (await c.query("UPDATE public.aigas_memberships SET role='OWNER' WHERE tenant_id=$1 AND user_id=$2", [A, MEMBER_A])).rowCount;
  });
  record('DB05', 'member-cannot-write', 'a MEMBER cannot change a membership row', out, out.ok && out.value === 0);
  out = await as('aigas_runtime', async c => {
    await scope(c, A, ADMIN_A);
    return (await c.query("UPDATE public.aigas_memberships SET role='ADMIN' WHERE tenant_id=$1 AND user_id=$2", [A, MEMBER_A])).rowCount;
  });
  record('DB05', 'manager-writes-other-member', 'an ADMIN manages a different member', out, out.ok && out.value === 1);
  out = await as('aigas_runtime', async c => {
    await scope(c, A, ADMIN_A);
    return (await c.query("UPDATE public.aigas_memberships SET role='MEMBER' WHERE tenant_id=$1 AND user_id=$2", [A, ADMIN_A])).rowCount;
  });
  record('DB05', 'manager-cannot-edit-self', 'a manager cannot change their own row (last-owner guard)', out, out.ok && out.value === 0);

  // Tenant rename: only a manager of that tenant.
  out = await as('aigas_runtime', async c => {
    await scope(c, A, ADMIN_A);
    return (await c.query("UPDATE public.aigas_tenants SET name='Synthetic Tenant A2' WHERE id=$1", [A])).rowCount;
  });
  record('DB05', 'manager-renames-own-tenant', 'an ADMIN renames their tenant', out, out.ok && out.value === 1);
  out = await as('aigas_runtime', async c => {
    await scope(c, A, MEMBER_A);
    return (await c.query("UPDATE public.aigas_tenants SET name='Synthetic Tenant A3' WHERE id=$1", [A])).rowCount;
  });
  record('DB05', 'member-cannot-rename-tenant', 'a MEMBER cannot rename the tenant', out, out.ok && out.value === 0);
  out = await as('aigas_runtime', async c => {
    await scope(c, A, OWNER_B);
    return (await c.query("UPDATE public.aigas_tenants SET name='hijacked' WHERE id=$1", [A])).rowCount;
  });
  record('DB05', 'foreign-owner-cannot-rename', 'the owner of B cannot rename tenant A', out, out.ok && out.value === 0);

  // Client roles: every verb on content + a product table.
  for (const role of ['authenticated', 'anonymous']) {
    for (const [sql, label] of [
      ['SELECT count(*)::int FROM public.aigas_tenants', 'select tenants'],
      ['SELECT count(*)::int FROM public.aigas_sc_messages', 'select chat content'],
      ["INSERT INTO public.aigas_fw_rules(id,tenant_id,name,pattern,action) VALUES(gen_random_uuid(),'aaaaaaaa-0000-4000-8000-00000000000a','x','x','ALLOW')", 'insert rule'],
      ["SELECT * FROM public.aigas_sc_usage_window_v2('aaaaaaaa-0000-4000-8000-00000000000a','22222222-2222-4222-8222-222222222222')", 'execute aggregate'],
    ]) {
      out = await as(role, c => c.query(sql));
      record('DB06', `${role}-${label.replaceAll(' ', '-')}`, `${role} is denied: ${label}`, out, !out.ok && out.code === '42501');
    }
  }

  // SECURITY DEFINER helpers return scope facts, not rows.
  out = await as('aigas_runtime', async c => {
    await scope(c, A, MEMBER_A);
    return (await c.query("SELECT public.aigas_is_tenant_member($1) AS m, public.aigas_actor_role($1) AS r, public.aigas_actor_is_manager($1) AS g", [A])).rows[0];
  });
  record('DB07', 'definer-helper-scope', 'helpers resolve membership/role for the scoped actor only',
    out, out.ok && out.value.m === true && out.value.r === 'MEMBER' && out.value.g === false);
  out = await as('aigas_runtime', async c => {
    await scope(c, A, OUTSIDER);
    return (await c.query("SELECT public.aigas_is_tenant_member($1) AS m, public.aigas_actor_role($1) AS r", [A])).rows[0];
  });
  record('DB05', 'definer-helper-non-member', 'helpers return false/null for a non-member', out,
    out.ok && out.value.m === false && out.value.r === null);

  // ------------------------------------------------------------ DB07 content
  const content = async (user, tenant, sql) => as('p03_content_probe', async c => {
    await scope(c, tenant, user);
    return (await c.query(sql)).rows;
  });
  out = await content(MEMBER_A, A, 'SELECT content FROM public.aigas_sc_messages ORDER BY content');
  record('DB07', 'participant-reads-own', 'a participant reads only their own message text', out,
    out.ok && out.value.length === 1 && out.value[0].content === 'member-a-secret');
  out = await content(OWNER_A, A, 'SELECT content FROM public.aigas_sc_messages ORDER BY content');
  record('DB07', 'other-participant-isolated', 'another participant in the same tenant cannot read it', out,
    out.ok && out.value.length === 1 && out.value[0].content === 'owner-a-secret');
  out = await as('p03_content_probe', async c => {
    await scope(c, A, OWNER_A);
    return (await c.query('SELECT count(*)::int AS n FROM public.aigas_sc_messages WHERE conversation_id=$1', [CONV_A])).rows[0].n;
  });
  record('DB07', 'non-participant-owner-blocked', 'tenant OWNER cannot read a conversation they did not participate in', out,
    out.ok && out.value === 0);
  out = await content(ADMIN_A, A, 'SELECT content FROM public.aigas_sc_messages');
  record('DB07', 'non-participant-admin-blocked', 'a non-participant ADMIN reads 0 rows of chat content', out,
    out.ok && out.value.length === 0);
  out = await content(OWNER_B, B, 'SELECT content FROM public.aigas_sc_messages');
  record('DB07', 'cross-tenant-content-blocked', 'the owner of tenant B reads 0 rows of tenant A content', out,
    out.ok && out.value.length === 0);
  out = await content(MEMBER_A, A, 'SELECT count(*)::int AS n FROM public.aigas_sc_conversations');
  record('DB07', 'participant-reads-own-conversation', 'a participant reads only their own conversation row', out,
    out.ok && out.value[0].n === 1);
  out = await content(ADMIN_A, A, 'SELECT count(*)::int AS n FROM public.aigas_sc_conversations');
  record('DB07', 'admin-reads-no-conversation', 'a non-participant ADMIN reads 0 conversation rows', out,
    out.ok && out.value[0].n === 0);
  out = await as('p03_content_probe', async c => {
    await scope(c, A, OWNER_A);
    return (await c.query("INSERT INTO public.aigas_sc_messages(tenant_id,user_id,conversation_id,id,model_ref,role,content) VALUES($1,$2,$3,gen_random_uuid(),'synthetic-model','user','spoofed')", [A, MEMBER_A, CONV_A])).rowCount;
  });
  record('DB07', 'cannot-write-as-another-author', 'a write attributed to another author is rejected by WITH CHECK', out,
    !out.ok && ['42501', 'P0001'].includes(out.code));
  out = await as('p03_content_probe', async c => {
    await scope(c, A, MEMBER_A);
    return (await c.query("INSERT INTO public.aigas_sc_messages(tenant_id,user_id,conversation_id,id,model_ref,role,content) VALUES($1,$2,$3,gen_random_uuid(),'synthetic-model','user','participant-write')", [A, MEMBER_A, CONV_A])).rowCount;
  });
  record('DB07', 'participant-writes-own', 'a participant can write their own message (control)', out, out.ok && out.value === 1);
  out = await as('p03_content_probe', async c => {
    return (await c.query('SELECT count(*)::int AS n FROM public.aigas_sc_messages')).rows[0].n;
  });
  record('DB07', 'content-without-tenant-scope', 'content with no scope returns 0 rows', out, out.ok && out.value === 0);

  // Owner baseline: why the owner connection is not the runtime posture.
  const owner = await admin(DB, 'neondb_owner');
  try {
    const seen = (await owner.query('SELECT count(*)::int AS n FROM public.aigas_fw_rules')).rows[0].n;
    record('DB04', 'owner-bypasses-rls-baseline', 'owner (BYPASSRLS) sees every tenant: documented, not a fix',
      { rules: seen }, seen === 2);
    const contentSeen = (await owner.query('SELECT count(*)::int AS n FROM public.aigas_sc_messages')).rows[0].n;
    record('DB04', 'owner-reads-all-content-baseline', 'owner can read chat content even with FORCE: cutover is the control',
      { messages: contentSeen }, contentSeen >= 2);
  } finally { await owner.end(); }
}

// ------------------------------------------------------------------ export
async function exportProbe() {
  const sql = [
    'SET LOCAL ROLE aigas_runtime;',
    `SELECT set_config('aigas.tenant_id','${A}',true);`,
    `SELECT set_config('aigas.user_id','${MEMBER_A}',true);`,
    'COPY (SELECT DISTINCT tenant_id FROM public.aigas_fw_rules) TO STDOUT WITH CSV;',
    'COPY public.aigas_audit_events (tenant_id, action) TO STDOUT WITH CSV;',
    'COPY (SELECT count(*) FROM public.aigas_memberships) TO STDOUT WITH CSV;',
    'COPY (SELECT count(*) FROM public.aigas_fw_decisions) TO STDOUT WITH CSV;',
    'COPY (SELECT tenant_id FROM public.aigas_fw_decisions) TO STDOUT WITH CSV;',
  ].join('\n');
  try {
    const { stdout } = await run(join(PGBIN, 'psql'), [
      '-h', SOCK, '-p', PORT, '-U', ADMIN, '-d', DB, '-v', 'ON_ERROR_STOP=1',
      '--single-transaction', '-t', '-A', '-c', sql,
    ]);
    const lines = stdout.trim().split('\n').filter(Boolean);
    sections.export = lines;
    const onlyA = lines.every(line => !line.includes(B));
    const decisionCount = lines.includes('1');
    record('DB05', 'export-respects-rls', 'COPY export under scope A yields only tenant A rows',
      { lines }, onlyA && lines.join(',').includes(A) && decisionCount);
  } catch (error) {
    record('DB05', 'export-respects-rls', 'COPY export under scope A contains no tenant B row',
      { error: String(error.stderr || error.message).split('\n')[0] }, false);
  }
}

// -------------------------------------------------------------------- main
try {
  step('bootstrap:start');
  await bootstrap();
  step('bootstrap:done');
  await applyMigrations();
  step('migrations:done');
  await seed();
  step('seed:done');
  await structural();
  step('structural:done');
  await behavioral();
  step('behavioral:done');
  await exportProbe();
  step('export:done');
} catch (error) {
  sections.fatal = { code: error.code, message: error.message.split('\n')[0] };
} finally {
  if (!keep) await pgctl('-m', 'immediate', 'stop').catch(() => {});
}

const failed = results.filter(r => !r.passed);
const evidence = {
  generatedAt: new Date().toISOString(),
  sha: (await run('git', ['rev-parse', 'HEAD'], { cwd: ROOT })).stdout.trim(),
  workdir: WORK,
  kept: keep,
  sections,
  checks: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  failures: failed,
  results,
  verdict: sections.fatal ? 'FAIL' : (failed.length === 0 ? 'PASS' : 'FAIL'),
};
if (jsonPath) {
  await mkdir(join(jsonPath, '..'), { recursive: true }).catch(() => {});
  await writeFile(jsonPath, JSON.stringify(evidence, null, 2));
}
console.log(JSON.stringify({
  verdict: evidence.verdict, checks: evidence.checks, passed: evidence.passed, failed: evidence.failed,
  failures: failed.map(f => `${f.area}/${f.id}`), fatal: sections.fatal ?? null,
}, null, 2));
process.exit(evidence.verdict === 'PASS' ? 0 : 1);
