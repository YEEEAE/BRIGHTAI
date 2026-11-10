// P03 — Read-only runtime/RLS posture capture of the isolated Neon target.
//
// Every statement must be a single SELECT. The guard below refuses anything else,
// so this script cannot create, alter, grant, revoke or write. The DSN is read from
// the environment and is never printed.
//
// Usage:
//   node --env-file=.env.staging.local scripts/audit-runtime-posture.mjs \
//     [--dsn-var DATABASE_URL_UNPOOLED] [--json <path>]

import pg from 'pg';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const arg = name => {
  const index = process.argv.indexOf(name);
  return index > -1 ? process.argv[index + 1] : null;
};
const dsnVar = arg('--dsn-var') || 'DATABASE_URL_UNPOOLED';
const jsonPath = arg('--json');
const dsn = process.env[dsnVar];
if (!dsn) {
  console.error(`REFUSED: ${dsnVar} is not set`);
  process.exit(2);
}

const client = new pg.Client({
  connectionString: dsn,
  application_name: 'aigas-p03-readonly',
  connectionTimeoutMillis: 15000,
  statement_timeout: 15000,
});

// Hard read-only gate: no DDL/DML and no second statement can reach the server.
function assertReadOnly(sql) {
  const body = sql.trim().replace(/;$/, '');
  if (!/^(select|with|show)\b/i.test(body)) throw new Error('REFUSED: non-SELECT statement');
  if (body.includes(';')) throw new Error('REFUSED: multi-statement');
  if (/\b(insert|update|delete|merge|grant|revoke|alter|create|drop|truncate|copy|call|do|set|reset)\b/i.test(
    body.replace(/'[^']*'/g, "''"))) throw new Error('REFUSED: write keyword in statement');
  return sql;
}
const q = async (sql, params) => (await client.query(assertReadOnly(sql), params)).rows;

await client.connect();

const evidence = { generatedAt: new Date().toISOString(), target: dsnVar };

evidence.identity = (await q(`SELECT current_database() AS database, current_user AS role,
  (SELECT setting FROM pg_settings WHERE name='server_version') AS server_version,
  pg_postmaster_start_time() AS started_at`))[0];

evidence.connectionRole = (await q(`SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb,
  rolreplication, rolcanlogin, rolinherit FROM pg_roles WHERE rolname=current_user`))[0];

evidence.privilegedLogins = await q(`SELECT rolname, rolsuper, rolbypassrls
  FROM pg_roles WHERE (rolsuper OR rolbypassrls) AND rolcanlogin ORDER BY 1`);

evidence.tableOwners = await q(`
  SELECT pg_get_userbyid(c.relowner) AS owner, count(*)::int AS tables
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%'
  GROUP BY 1 ORDER BY 2 DESC`);

evidence.runtimeOwnedTables = (await q(`
  SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%'
    AND pg_get_userbyid(c.relowner)='aigas_runtime'`))[0].n;

evidence.runtimeRole = (await q(`SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb,
  rolreplication, rolcanlogin, rolinherit FROM pg_roles WHERE rolname='aigas_runtime'`))[0] ?? null;

evidence.runtimeMemberships = await q(`
  SELECT parent.rolname AS granted_role, m.inherit_option, m.set_option, m.admin_option
  FROM pg_auth_members m
  JOIN pg_roles parent ON parent.oid=m.roleid
  JOIN pg_roles member ON member.oid=m.member
  WHERE member.rolname='aigas_runtime' ORDER BY 1`);

evidence.rls = await q(`
  SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
         (SELECT count(*)::int FROM pg_policy p WHERE p.polrelid=c.oid) AS policies,
         pg_get_userbyid(c.relowner) AS owner,
         pg_get_userbyid(c.relowner) = current_user AS owned_by_connection
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%' ORDER BY 1`);

evidence.policySummary = await q(`
  SELECT tablename, policyname, permissive, roles::text AS roles,
         coalesce(qual, '') ILIKE '%user_id%' AS qual_has_user,
         coalesce(with_check, '') ILIKE '%user_id%' AS check_has_user
  FROM pg_policies WHERE schemaname='public'
  ORDER BY tablename, policyname`);

// Client-role access, folded through membership/PUBLIC.
evidence.clientTableAccess = await q(`
  SELECT role, c.relname,
    array_remove(ARRAY[
      CASE WHEN has_table_privilege(role, c.oid, 'SELECT') THEN 'SELECT' END,
      CASE WHEN has_table_privilege(role, c.oid, 'INSERT') THEN 'INSERT' END,
      CASE WHEN has_table_privilege(role, c.oid, 'UPDATE') THEN 'UPDATE' END,
      CASE WHEN has_table_privilege(role, c.oid, 'DELETE') THEN 'DELETE' END,
      CASE WHEN has_table_privilege(role, c.oid, 'TRUNCATE') THEN 'TRUNCATE' END
    ], NULL) AS verbs
  FROM unnest(ARRAY['authenticated','anonymous']::text[]) AS role
  CROSS JOIN (SELECT c.oid, c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%') c`);

evidence.publicTableAccess = await q(`
  SELECT c.relname, array_agg(DISTINCT a.privilege_type ORDER BY a.privilege_type) AS verbs
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  CROSS JOIN LATERAL aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
  WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%' AND a.grantee=0
  GROUP BY c.relname`);

evidence.functions = await q(`
  SELECT p.oid::regprocedure::text AS signature, p.prosecdef AS security_definer,
         pg_get_userbyid(p.proowner) AS owner,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
         has_function_privilege('anonymous', p.oid, 'EXECUTE') AS anonymous,
         has_function_privilege('aigas_runtime', p.oid, 'EXECUTE') AS runtime
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' ORDER BY 1`);

evidence.defaultAcl = await q(`
  SELECT pg_get_userbyid(d.defaclrole) AS owner, d.defaclobjtype AS object_type,
         array_to_string(d.defaclacl, ' | ') AS acl
  FROM pg_default_acl d ORDER BY 1,2`);

evidence.runtimeTableGrants = await q(`
  SELECT c.relname,
    array_remove(ARRAY[
      CASE WHEN has_table_privilege('aigas_runtime', c.oid, 'SELECT') THEN 'SELECT' END,
      CASE WHEN has_table_privilege('aigas_runtime', c.oid, 'INSERT') THEN 'INSERT' END,
      CASE WHEN has_table_privilege('aigas_runtime', c.oid, 'UPDATE') THEN 'UPDATE' END,
      CASE WHEN has_table_privilege('aigas_runtime', c.oid, 'DELETE') THEN 'DELETE' END,
      CASE WHEN has_table_privilege('aigas_runtime', c.oid, 'TRUNCATE') THEN 'TRUNCATE' END
    ], NULL) AS verbs
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'aigas\\_%' ORDER BY 1`);

evidence.contentAccess = evidence.runtimeTableGrants.filter(r => /aigas_sc_(messages|conversations)/.test(r.relname));

evidence.rowCounts = await q(`
  SELECT 'aigas_tenants' AS table_name, count(*)::int AS rows FROM public.aigas_tenants
  UNION ALL SELECT 'aigas_memberships', count(*)::int FROM public.aigas_memberships
  UNION ALL SELECT 'aigas_sc_conversations', count(*)::int FROM public.aigas_sc_conversations
  UNION ALL SELECT 'aigas_sc_messages', count(*)::int FROM public.aigas_sc_messages
  UNION ALL SELECT 'aigas_fw_decisions', count(*)::int FROM public.aigas_fw_decisions
  UNION ALL SELECT 'neon_auth.user', count(*)::int FROM neon_auth."user"`);

evidence.ledger = (await q(`
  SELECT count(*)::int AS entries,
    count(*) FILTER (WHERE status='APPLIED')::int AS applied
  FROM ops.aigas_migration_ledger`).catch(error => ({ error: error.code })));

await client.end();

// Derived verdicts, so the report cannot claim more than the rows show.
const check = (label, passed) => ({ label, passed });
// This DSN is the migration/owner credential by design; the app runtime must use a
// different one. Recorded as an observation, not scored as a posture pass.
evidence.observations = {
  dsnRole: evidence.connectionRole?.rolname ?? null,
  dsnRoleIsRuntime: evidence.connectionRole?.rolname === 'aigas_runtime',
  dsnRoleBypassesRls: Boolean(evidence.connectionRole?.rolbypassrls),
};
evidence.verdicts = [
  check('aigas_runtime exists with NOBYPASSRLS and no owner rights', Boolean(evidence.runtimeRole) && !evidence.runtimeRole.rolsuper && !evidence.runtimeRole.rolbypassrls && !evidence.runtimeRole.rolcreaterole),
  check('aigas_runtime owns no AIGAS table', evidence.runtimeOwnedTables === 0),
  check('no AIGAS table is owned by the runtime role', !evidence.rls.some(r => r.owner === 'aigas_runtime')),
  check('RLS enabled on every AIGAS table', evidence.rls.length > 0 && evidence.rls.every(r => r.relrowsecurity)),
  check('FORCE RLS on the two content tables', evidence.rls.filter(r => r.relforcerowsecurity).map(r => r.relname).sort().join(',') === 'aigas_sc_conversations,aigas_sc_messages'),
  check('client roles hold zero table verbs', !evidence.clientTableAccess.some(r => (r.verbs ?? []).length) && evidence.publicTableAccess.length === 0),
  check('client roles execute zero public functions', evidence.functions.length > 0 && evidence.functions.every(f => !f.authenticated && !f.anonymous)),
  check('runtime holds zero verbs on chat content', evidence.contentAccess.every(r => (r.verbs ?? []).length === 0)),
  check('no client default ACL', !evidence.defaultAcl.some(d => /authenticated|anonymous/.test(d.acl ?? ''))),
];

const failed = evidence.verdicts.filter(v => !v.passed);
if (jsonPath) {
  await mkdir(join(jsonPath, '..'), { recursive: true }).catch(() => {});
  await writeFile(jsonPath, JSON.stringify(evidence, null, 2));
}
console.log(JSON.stringify({
  identity: evidence.identity,
  verdicts: evidence.verdicts.length,
  passed: evidence.verdicts.length - failed.length,
  failed: failed.map(f => f.label),
  verdict: failed.length === 0 ? 'PASS' : 'FAIL',
}, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
