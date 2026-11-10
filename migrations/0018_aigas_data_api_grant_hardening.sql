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

-- Ordering guard: 0018 must run before 0025. If 0025 already installed the
-- restrictive client-deny policy, re-running 0018 would recreate the older
-- Secure Chat policies with a different GUC pair and leave two overlapping
-- predicates. Fail instead of silently changing the posture.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND policyname = 'aigas_client_deny'
  ) THEN
    RAISE EXCEPTION '0018 is superseded by 0025; apply 0018 before 0025 only';
  END IF;
END $$;

-- 1. Remove all client-role privileges on existing public objects.
-- Client roles exist only when the Data API or Neon Auth created them. Guarding
-- on to_regrole keeps this file runnable on a project without those roles
-- instead of aborting with 42704 before any posture is established. The guard
-- changes no grant: when the role exists the REVOKE is identical.
DO $$
BEGIN
  IF to_regrole('authenticated') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated';
  END IF;
  IF to_regrole('anonymous') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anonymous';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anonymous';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anonymous';
  END IF;
  -- Functions are EXECUTE to PUBLIC by default in PostgreSQL. Revoking from
  -- `authenticated` alone leaves that inherited path open. `public` is server-only,
  -- so remove the PUBLIC path too; the owner keeps its implicit rights and the
  -- runtime role is granted explicitly by 0025.
  EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC';
END $$;

-- 2. Stop auto-granting on future objects created by the owner connection.
DO $$
BEGIN
  IF to_regrole('authenticated') IS NOT NULL THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM authenticated';
  END IF;
  IF to_regrole('anonymous') IS NOT NULL THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON TABLES FROM anonymous';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anonymous';
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anonymous';
  END IF;
END $$;

-- 3. Keep the two owner-scoped policies, but require a real membership row in addition to
--    the GUCs. The GUCs are transaction-local and set by the server after JWT verification;
--    they are not a permission of their own. Use the unified `aigas.tenant_id` /
--    `aigas.user_id` names that `src/server/kernel/db.mjs` sets. The older `aigas.sc_*`
--    pair now feeds only the read-only usage aggregate in 0016, not table access.
DROP POLICY IF EXISTS sc_request_owner ON public.aigas_sc_requests;
CREATE POLICY sc_request_owner ON public.aigas_sc_requests
  FOR ALL TO public
  USING (
    tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM public.aigas_memberships m
      WHERE m.tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
        AND m.user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM public.aigas_memberships m
      WHERE m.tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
        AND m.user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
    )
  );

DROP POLICY IF EXISTS sc_cancellation_owner ON public.aigas_sc_cancellations;
CREATE POLICY sc_cancellation_owner ON public.aigas_sc_cancellations
  FOR ALL TO public
  USING (
    tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM public.aigas_memberships m
      WHERE m.tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
        AND m.user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
    AND user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM public.aigas_memberships m
      WHERE m.tenant_id = nullif(current_setting('aigas.tenant_id', true), '')::uuid
        AND m.user_id = nullif(current_setting('aigas.user_id', true), '')::uuid
    )
  );

-- 4. SECURITY DEFINER aggregates must not be callable by a client role.
DO $$
BEGIN
  IF to_regprocedure('public.aigas_sc_usage_window(uuid,uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window(uuid,uuid) FROM PUBLIC';
    IF to_regrole('authenticated') IS NOT NULL THEN
      EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window(uuid,uuid) FROM authenticated';
    END IF;
  END IF;
  IF to_regprocedure('public.aigas_sc_usage_window_v2(uuid,uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) FROM PUBLIC';
    IF to_regrole('authenticated') IS NOT NULL THEN
      EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) FROM authenticated';
    END IF;
  END IF;
END $$;

COMMIT;
