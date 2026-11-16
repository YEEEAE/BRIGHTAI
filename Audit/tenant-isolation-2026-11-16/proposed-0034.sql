-- 0034 — forward-only closure after 0033 (PROPOSED, NOT APPLIED)
--
-- Purpose:
--   1. Restore the invariant "every public.aigas_* table has the restrictive
--      aigas_client_deny policy" that 0033 did not carry to the new table.
--   2. Make the RLS membership predicate reject banned Auth identities, matching
--      the server-side checks in memberships() and aigas_lock_member().
--
-- Does NOT change 0033's applied hash, does not create tenant/business rows,
-- does not create the runtime login, and does not alter Data API control-plane
-- settings (that is an owner action outside SQL).
--
-- Prerequisites: 0018, 0022, 0025, 0033 applied; neon_auth."user" exists;
-- applied by the AIGAS table owner or a BYPASSRLS migration role.

BEGIN;

-- 1. Restrictive client deny for the table introduced by 0033.
DROP POLICY IF EXISTS aigas_client_deny ON public.aigas_exploration_grants;
CREATE POLICY aigas_client_deny ON public.aigas_exploration_grants
  AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (current_user NOT IN ('authenticated','anonymous','authenticator'))
  WITH CHECK (current_user NOT IN ('authenticated','anonymous','authenticator'));

REVOKE ALL ON public.aigas_exploration_grants FROM PUBLIC;

DO $$
BEGIN
  IF to_regrole('authenticated') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.aigas_exploration_grants FROM authenticated';
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_exploration_consume(uuid,text) FROM authenticated';
  END IF;
  IF to_regrole('anonymous') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.aigas_exploration_grants FROM anonymous';
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_exploration_consume(uuid,text) FROM anonymous';
  END IF;
END $$;

-- 2. Membership predicate also requires a non-banned directory identity.
--    SECURITY DEFINER keeps the membership read non-recursive; only a boolean leaves.
CREATE OR REPLACE FUNCTION public.aigas_is_tenant_member(wanted uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT wanted IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.aigas_memberships m
    JOIN neon_auth."user" u ON u.id = m.user_id
    WHERE m.tenant_id = wanted
      AND m.user_id = public.aigas_actor()
      AND u.banned IS NOT TRUE
  )
$$;

REVOKE ALL ON FUNCTION public.aigas_is_tenant_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aigas_is_tenant_member(uuid) TO aigas_runtime;

-- 3. Fail closed if any AIGAS table still lacks the restrictive client deny.
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO missing
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname LIKE 'aigas\_%'
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename = c.relname
        AND p.policyname = 'aigas_client_deny'
    );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'aigas_client_deny is missing on: %', missing;
  END IF;
END $$;

COMMIT;
