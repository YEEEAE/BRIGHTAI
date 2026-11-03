-- LEAST-PRIVILEGE RUNTIME ROLE AND TENANT RLS — LOCAL REVIEW ONLY. NOT APPLIED ANYWHERE.
--
-- Purpose: the Node server currently connects as neondb_owner, which has rolbypassrls=true.
-- RLS is therefore not an isolation layer today; isolation depends entirely on explicit
-- `tenant_id=$n` predicates in server code. This migration prepares a NOBYPASSRLS role so RLS
-- becomes a second layer once the operator moves DATABASE_URL to it.
--
-- BEFORE APPLYING (all required, none performed here):
--   1. Owner approval and a documented runtime-role cutover window.
--   2. Apply on an isolated development branch with a restore point.
--   3. Apply migrations/0018 first.
--   4. Solve workspace bootstrap (see note 7) before switching DATABASE_URL.
--   5. Create a login credential for aigas_runtime outside SQL and store it only in the
--      platform secret store. Do not commit or paste the credential.
--
-- This file changes DCL/definitions only. It creates no tenant, member, policy or content row.
BEGIN;

-- 1. Non-login role; the login credential is created by the operator, not by this file.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aigas_runtime') THEN
    CREATE ROLE aigas_runtime NOLOGIN NOINHERIT NOBYPASSRLS;
  ELSE
    ALTER ROLE aigas_runtime NOLOGIN NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

-- 2. Object privileges. RLS policies below still bound every row to the transaction scope.
GRANT USAGE ON SCHEMA public TO aigas_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aigas_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aigas_runtime;

-- 3. Read-only access to the Auth directory columns the server actually reads.
GRANT USAGE ON SCHEMA neon_auth TO aigas_runtime;
GRANT SELECT (id, name, email, banned, "emailVerified") ON neon_auth."user" TO aigas_runtime;
GRANT SELECT (id, email, status, "expiresAt", "organizationId", "inviterId", role) ON neon_auth.invitation TO aigas_runtime;
GRANT SELECT ("organizationId", "userId", role) ON neon_auth.member TO aigas_runtime;
REVOKE INSERT, UPDATE, DELETE ON neon_auth."user", neon_auth.invitation, neon_auth.member FROM aigas_runtime;

-- 4. Scope helpers read transaction-local GUCs that the server sets only after verifying the
--    bearer token and the membership row. They are stable, non-leaking predicates.
CREATE OR REPLACE FUNCTION public.aigas_actor()
RETURNS uuid LANGUAGE sql STABLE SET search_path = pg_catalog, public AS $$
  SELECT nullif(current_setting('aigas.user_id', true), '')::uuid
$$;

-- SECURITY DEFINER avoids recursive RLS evaluation when the predicate is used on the
-- memberships table itself. It returns a boolean only, never membership rows.
CREATE OR REPLACE FUNCTION public.aigas_is_tenant_member(wanted uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.aigas_memberships m
    WHERE m.tenant_id = wanted AND m.user_id = public.aigas_actor()
  )
$$;

CREATE OR REPLACE FUNCTION public.aigas_tenant_scope(wanted uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = pg_catalog, public AS $$
  SELECT wanted IS NOT NULL
    AND wanted = nullif(current_setting('aigas.tenant_id', true), '')::uuid
    AND public.aigas_is_tenant_member(wanted)
$$;

REVOKE ALL ON FUNCTION public.aigas_actor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_is_tenant_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_tenant_scope(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aigas_actor() TO aigas_runtime;
GRANT EXECUTE ON FUNCTION public.aigas_is_tenant_member(uuid) TO aigas_runtime;
GRANT EXECUTE ON FUNCTION public.aigas_tenant_scope(uuid) TO aigas_runtime;

-- 5. Membership bootstrap: a caller can read only their own membership rows before a tenant is
--    selected. Tenant-wide member management is covered by the tenant policy below, while the
--    role decision (OWNER/ADMIN) stays a server-side check.
DROP POLICY IF EXISTS aigas_runtime_self_membership ON public.aigas_memberships;
CREATE POLICY aigas_runtime_self_membership ON public.aigas_memberships
  FOR SELECT TO aigas_runtime
  USING (user_id = public.aigas_actor());

DROP POLICY IF EXISTS aigas_runtime_tenant_membership ON public.aigas_memberships;
CREATE POLICY aigas_runtime_tenant_membership ON public.aigas_memberships
  FOR ALL TO aigas_runtime
  USING (public.aigas_is_tenant_member(tenant_id))
  WITH CHECK (public.aigas_is_tenant_member(tenant_id));

DROP POLICY IF EXISTS aigas_runtime_self_tenants ON public.aigas_tenants;
CREATE POLICY aigas_runtime_self_tenants ON public.aigas_tenants
  FOR SELECT TO aigas_runtime
  USING (public.aigas_is_tenant_member(id));

-- 6. Tenant-scoped policy on every remaining AIGAS table. Each USING and WITH CHECK requires
--    the transaction tenant to match and the actor to be a member of that exact tenant.
DO $$
DECLARE
  target text;
  tables text[] := ARRAY[
    'aigas_audit_events','aigas_auth_organizations','aigas_department_events',
    'aigas_department_memberships','aigas_departments','aigas_fw_decisions','aigas_fw_rules',
    'aigas_hg_decisions','aigas_hg_events','aigas_hg_policies','aigas_hg_requests',
    'aigas_kernel_policy_decisions','aigas_ld_events','aigas_ld_evidence_requirements',
    'aigas_member_invitations','aigas_policies','aigas_policy_approvals',
    'aigas_policy_delegations','aigas_policy_versions','aigas_product_access',
    'aigas_product_grants','aigas_re_assessments','aigas_re_asset_revisions','aigas_re_assets',
    'aigas_re_treatment_revisions','aigas_sc_cancellations','aigas_sc_conversations',
    'aigas_sc_messages','aigas_sc_requests'
  ];
BEGIN
  FOREACH target IN ARRAY tables LOOP
    IF to_regclass('public.' || target) IS NULL THEN
      RAISE EXCEPTION 'missing table public.%', target;
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS aigas_runtime_tenant ON public.%I', target);
    EXECUTE format(
      'CREATE POLICY aigas_runtime_tenant ON public.%I FOR ALL TO aigas_runtime '
      'USING (public.aigas_tenant_scope(tenant_id)) '
      'WITH CHECK (public.aigas_tenant_scope(tenant_id))', target);
  END LOOP;
END $$;

-- 7. Workspace bootstrap is intentionally NOT solved here. Creating the first tenant and its
--    OWNER membership must happen before any tenant scope exists, so it needs an explicit
--    SECURITY DEFINER function or a separate privileged provisioning path with its own review.
--    Until then, do not point DATABASE_URL at aigas_runtime.

-- 8. Usage aggregates owned by the owner connection stay callable only by this role.
DO $$
BEGIN
  IF to_regprocedure('public.aigas_sc_usage_window_v2(uuid,uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) TO aigas_runtime';
  END IF;
END $$;

COMMIT;
