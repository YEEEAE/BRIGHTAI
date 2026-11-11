-- Read-only statements actually issued through Neon MCP on 2026-11-10.
-- project_id: young-frog-60183055
-- branch_id: br-young-bird-b43proeb (production)
-- database_name: neondb
-- role_name: omitted (connector database-owner default); this is NOT runtime-role proof.
-- max_rows: 100 for the grants/table query; 80 for the migration query.
-- No client records or content were selected, and no mutation was issued.

-- Summary (returned: 31/31/2/0/0).
SELECT current_database() AS db, version(),
 (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r') AS tables,
 (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity) AS rls_tables,
 (SELECT count(*) FROM pg_policies WHERE schemaname='public') AS policies,
 (SELECT count(*) FROM pg_roles WHERE rolname='aigas_runtime') AS runtime_roles,
 (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%migration%') AS migration_ledgers;

-- Tables, policies, and client table grants (result saved in live-evidence.json).
SELECT 'table' AS kind,c.relname AS name,jsonb_build_object('rls',c.relrowsecurity,'force',c.relforcerowsecurity,'owner',pg_get_userbyid(c.relowner)) AS details
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'
UNION ALL SELECT 'policy',tablename::text,jsonb_build_object('name',policyname,'roles',roles,'cmd',cmd,'qual',qual,'check',with_check) FROM pg_policies WHERE schemaname='public'
UNION ALL SELECT 'grant',grantee,jsonb_build_object('privilege',privilege_type,'table_count',count(*)) FROM information_schema.role_table_grants
WHERE table_schema='public' AND grantee IN ('authenticated','anonymous','anon','PUBLIC','aigas_runtime') GROUP BY grantee,privilege_type;

-- Migration object comparison (full returned rows saved in migration-catalog.json).
-- Absent rows for selected columns/functions/trigger mean absent within this exact query scope.
SELECT 'object' AS kind, name, (to_regclass('public.'||name) IS NOT NULL)::text AS value
FROM unnest(ARRAY['aigas_trial_requests','aigas_trial_events','aigas_trial_entitlements','aigas_hg_delegations','aigas_hg_grants']) AS x(name)
UNION ALL SELECT 'column',table_name||'.'||column_name,data_type FROM information_schema.columns
WHERE table_schema='public' AND ((table_name='aigas_audit_events' AND column_name IN ('correlation_id','policy_version','idempotency_key'))
 OR (table_name='aigas_re_treatment_revisions' AND column_name LIKE 'residual%')
 OR (table_name='aigas_ld_events' AND column_name IN ('request_fingerprint','chain_version','sequence_no','previous_hash')))
UNION ALL SELECT 'function',p.proname,has_function_privilege('authenticated',p.oid,'EXECUTE')::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
UNION ALL SELECT 'trigger',tgname,tgenabled::text FROM pg_trigger WHERE NOT tgisinternal AND tgname='aigas_ld_events_chain_guard';

-- Counts only (saved in additional-evidence.json).
SELECT (SELECT count(*) FROM neon_auth."user") AS auth_users,
 (SELECT count(*) FROM neon_auth.session) AS auth_sessions,
 (SELECT count(*) FROM neon_auth.organization) AS auth_orgs,
 (SELECT count(*) FROM public.aigas_tenants) AS tenants,
 (SELECT count(*) FROM public.aigas_memberships) AS memberships,
 (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relforcerowsecurity) AS force_rls,
 (SELECT count(*) FROM information_schema.table_constraints WHERE constraint_schema='public' AND constraint_name LIKE '%scope%') AS scope_constraints;
