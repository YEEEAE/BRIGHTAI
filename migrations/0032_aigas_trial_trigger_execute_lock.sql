-- Forward-only repair for 0030: trigger execution does not require caller EXECUTE.
-- Do not rewrite the 0030 hash. The SECURITY DEFINER trigger is not a client RPC.
BEGIN;
REVOKE ALL ON FUNCTION public.aigas_trial_readiness_guard() FROM PUBLIC;
DO $$
DECLARE client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['authenticated', 'anonymous', 'aigas_runtime'] LOOP
    IF to_regrole(client_role) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.aigas_trial_readiness_guard() FROM %I', client_role);
    END IF;
  END LOOP;
END $$;
COMMIT;
