// Capture a catalog snapshot for parity comparison. SELECT only.
//
// The DSN is read from DATABASE_URL_UNPOOLED and never printed. Writes one JSON file in
// the shape scripts/db-parity-diff.mjs expects on the --actual side.
//
// Usage: node --env-file=.env capture-catalog.mjs --out <file> [--label <text>]

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import pg from 'pg';

const args = process.argv.slice(2);
const value = name => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : undefined; };
const outPath = value('--out');
const label = value('--label') ?? 'target';

if (!outPath) {
  console.error('usage: node --env-file=.env scripts/capture-catalog.mjs --out <file> [--label <text>]');
  process.exit(2);
}
const dsn = process.env.DATABASE_URL_UNPOOLED;
if (!dsn) {
  console.error('REFUSED: DATABASE_URL_UNPOOLED is not set');
  process.exit(2);
}

const client = new pg.Client({ connectionString: dsn, application_name: 'aigas-catalog-capture', connectionTimeoutMillis: 15000 });
await client.connect();
const rows = async (sql, params) => (await client.query(sql, params)).rows;

const tables = await rows(`SELECT c.relname, c.relrowsecurity AS rls, c.relforcerowsecurity AS force
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' ORDER BY 1`);

const catalog = {
  source: label,
  method: 'direct SELECT catalog capture',
  capturedAt: new Date().toISOString(),
  serverVersion: (await rows('SHOW server_version'))[0].server_version,
  database: (await rows('SELECT current_database() AS db'))[0].db,
  tables,
  rlsEnabled: tables.filter(t => t.rls).length,
  forceRls: tables.filter(t => t.force).length,
  policies: await rows(`SELECT tablename, policyname, permissive FROM pg_policies WHERE schemaname='public' ORDER BY 1,2`),
  functions: await rows(`SELECT p.proname, p.prosecdef AS secdef FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'aigas\\_%' ORDER BY 1`),
  triggers: await rows(`SELECT t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY 1`),
  indexes: await rows(`SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY 1`),
  sequences: (await rows(`SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='S'`))[0].n,
  clientTableGrants: (await rows(`SELECT count(*)::int AS n FROM information_schema.role_table_grants
    WHERE table_schema='public' AND grantee IN ('authenticated','anonymous')`))[0].n,
  clientFunctionGrants: (await rows(`SELECT count(*)::int AS n FROM information_schema.role_routine_grants
    WHERE specific_schema='public' AND grantee IN ('authenticated','anonymous')`))[0].n,
  runtimeRoleExists: (await rows(`SELECT count(*)::int AS n FROM pg_roles WHERE rolname='aigas_runtime'`))[0].n > 0,
  runtimeRole: (await rows(`SELECT rolsuper, rolbypassrls, rolcanlogin, rolinherit FROM pg_roles WHERE rolname='aigas_runtime'`))[0] ?? null,
  runtimeGrants: (await rows(`SELECT table_name, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privs
    FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee='aigas_runtime'
    GROUP BY table_name ORDER BY 1`)),
  contentTableRuntimeGrants: await rows(`SELECT table_name, string_agg(privilege_type, ',') AS privs
    FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee='aigas_runtime'
      AND table_name IN ('aigas_sc_messages','aigas_sc_conversations') GROUP BY 1`),
  defaultAcl: await rows(`SELECT defaclrole::regrole::text AS role, defaclobjtype AS type, defaclacl::text AS acl
    FROM pg_default_acl ORDER BY 1,2`),
  ledgerTriggers: await rows(`SELECT t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal
      AND t.tgname IN ('aigas_ld_events_chain_guard','aigas_ld_events_append_only','aigas_ld_events_no_truncate')
    ORDER BY 1`),
  ledgerConstraintHasFingerprint: ((await rows(`SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint
    WHERE conname='aigas_ld_events_check'`))[0]?.def ?? '').includes('request_fingerprint'),
  migrationLedger: await rows(`SELECT filename, sha256, status, duration_ms FROM ops.aigas_migration_ledger ORDER BY filename`)
    .catch(() => []),
  neonAuthTables: (await rows(`SELECT tablename FROM pg_tables WHERE schemaname='neon_auth' ORDER BY 1`)).map(r => r.tablename),
  // Role memberships matter for parity: a client/runtime role the owner cannot SET ROLE to
  // makes every SQL-level posture probe fail with 42501 instead of exercising the policy.
  roles: await rows(`SELECT rolname, rolcanlogin, rolsuper, rolinherit, rolbypassrls, rolcreaterole
    FROM pg_roles WHERE rolname IN ('neondb_owner','authenticated','anonymous','aigas_runtime','neon_auth','authenticator')
    ORDER BY 1`),
  memberships: await rows(`SELECT g.rolname AS granted, m.rolname AS member, am.grantor::regrole::text AS grantor,
      am.admin_option, am.inherit_option, am.set_option
    FROM pg_auth_members am
    JOIN pg_roles g ON g.oid=am.roleid JOIN pg_roles m ON m.oid=am.member
    WHERE g.rolname IN ('authenticated','anonymous','aigas_runtime','neon_auth')
    ORDER BY 1,2,3`),
};

await client.end();
await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify(catalog, null, 2));

console.log(JSON.stringify({
  out: outPath,
  serverVersion: catalog.serverVersion,
  tables: catalog.tables.length,
  rls: catalog.rlsEnabled,
  forceRls: catalog.forceRls,
  policies: catalog.policies.length,
  functions: catalog.functions.length,
  clientTableGrants: catalog.clientTableGrants,
  clientFunctionGrants: catalog.clientFunctionGrants,
  runtimeRoleExists: catalog.runtimeRoleExists,
  runtimeRole: catalog.runtimeRole,
  runtimeGrants: catalog.runtimeGrants.length,
  contentTableRuntimeGrants: catalog.contentTableRuntimeGrants,
  ledgerTriggers: catalog.ledgerTriggers.map(t => t.tgname),
  ledgerConstraintHasFingerprint: catalog.ledgerConstraintHasFingerprint,
  migrationLedgerRows: catalog.migrationLedger.length,
  neonAuthTables: catalog.neonAuthTables.length,
}, null, 2));
