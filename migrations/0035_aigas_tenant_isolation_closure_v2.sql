-- Local review; external application requires separate approval.
BEGIN;
DO $$
DECLARE target text; client_role text;
BEGIN
  FOREACH target IN ARRAY ARRAY['aigas_exploration_grants','aigas_self_service_trials'] LOOP
    EXECUTE format('CREATE POLICY aigas_client_deny ON public.%I AS RESTRICTIVE FOR ALL TO PUBLIC USING (current_user NOT IN (''authenticated'',''anonymous'',''authenticator'')) WITH CHECK (current_user NOT IN (''authenticated'',''anonymous'',''authenticator''))', target);
    FOREACH client_role IN ARRAY ARRAY['authenticated','anonymous'] LOOP
      IF to_regrole(client_role) IS NOT NULL THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', target, client_role);
      END IF;
    END LOOP;
  END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.aigas_is_tenant_member(wanted uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT wanted IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.aigas_memberships m
    JOIN neon_auth."user" u ON u.id=m.user_id
    WHERE m.tenant_id=wanted AND m.user_id=public.aigas_actor() AND u.banned IS NOT TRUE
  )
$$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname LIKE 'aigas\_%'
      AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid
        AND p.polname='aigas_client_deny' AND NOT p.polpermissive)
  ) THEN RAISE EXCEPTION 'AIGAS table missing restrictive aigas_client_deny'; END IF;
END $$;
-- Delta 0024 leaves the repaired ledger CHECK unvalidated; fresh 0029 validates it.
ALTER TABLE public.aigas_ld_events VALIDATE CONSTRAINT aigas_ld_events_check;
COMMIT;
