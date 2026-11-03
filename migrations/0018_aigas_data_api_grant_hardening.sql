-- DATA API / ROLE GRANT HARDENING — LOCAL REVIEW ONLY. NOT APPLIED ANYWHERE.
--
-- Reason: Neon Data API is ACTIVE for schema public on branch production, and the default
-- ACL for neondb_owner auto-grants SELECT/INSERT/UPDATE/DELETE on every new table to the
-- `authenticated` role. RLS is enabled but only two SC tables have policies, so the current
-- effective exposure is "default deny by RLS" rather than "no grant at all". This migration
-- removes the grant layer so a future policy mistake cannot become client access.
--
-- BEFORE APPLYING (all required, none performed here):
--   1. Owner approval that the browser/Data API must not reach AIGAS tables.
--   2. Apply on an isolated development branch with a restore point.
--   3. Verify the Node server connects as its own role and never as `authenticated`.
--   4. Keep Neon Data API configuration change (disable endpoint / restrict schemas) as a
--      separate control-plane action; SQL cannot disable the Data API itself.
--
-- This file changes DCL only. It introduces or edits no business rows.
BEGIN;

-- 1. Remove all client-role privileges on existing public objects.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anonymous;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anonymous;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anonymous;

-- 2. Stop auto-granting on future objects created by the owner connection.
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON TABLES FROM anonymous;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anonymous;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anonymous;

-- 3. Keep the two owner-scoped policies, but require a real membership row in addition to
--    the GUCs. The GUCs are transaction-local and set by the server after JWT verification;
--    they are not a permission of their own.
DROP POLICY IF EXISTS sc_request_owner ON public.aigas_sc_requests;
CREATE POLICY sc_request_owner ON public.aigas_sc_requests
  FOR ALL TO public
  USING (
    tenant_id = nullif(current_setting('aigas.sc_tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.sc_user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM public.aigas_memberships m
      WHERE m.tenant_id = nullif(current_setting('aigas.sc_tenant_id', true), '')::uuid
        AND m.user_id = nullif(current_setting('aigas.sc_user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    tenant_id = nullif(current_setting('aigas.sc_tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.sc_user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM public.aigas_memberships m
      WHERE m.tenant_id = nullif(current_setting('aigas.sc_tenant_id', true), '')::uuid
        AND m.user_id = nullif(current_setting('aigas.sc_user_id', true), '')::uuid
    )
  );

DROP POLICY IF EXISTS sc_cancellation_owner ON public.aigas_sc_cancellations;
CREATE POLICY sc_cancellation_owner ON public.aigas_sc_cancellations
  FOR ALL TO public
  USING (
    tenant_id = nullif(current_setting('aigas.sc_tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.sc_user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM public.aigas_memberships m
      WHERE m.tenant_id = nullif(current_setting('aigas.sc_tenant_id', true), '')::uuid
        AND m.user_id = nullif(current_setting('aigas.sc_user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    tenant_id = nullif(current_setting('aigas.sc_tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.sc_user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM public.aigas_memberships m
      WHERE m.tenant_id = nullif(current_setting('aigas.sc_tenant_id', true), '')::uuid
        AND m.user_id = nullif(current_setting('aigas.sc_user_id', true), '')::uuid
    )
  );

-- 4. SECURITY DEFINER aggregates must not be callable by a client role.
DO $$
BEGIN
  IF to_regprocedure('public.aigas_sc_usage_window(uuid,uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window(uuid,uuid) FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window(uuid,uuid) FROM authenticated';
  END IF;
  IF to_regprocedure('public.aigas_sc_usage_window_v2(uuid,uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) FROM authenticated';
  END IF;
END $$;

COMMIT;
