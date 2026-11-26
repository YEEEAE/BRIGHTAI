-- P02 agent-persistence acceptance probe. WRITE TEST — ALWAYS ROLLED BACK.
-- Intended for the isolated audit branch (or an authorized staging branch).
-- No customer data; synthetic UUIDs only. No secret or hidden reasoning is read.
BEGIN;

-- 0. Catalog assertions: signatures, RLS/FORCE, policies, ACL, SECURITY DEFINER.
DO $$
DECLARE rel text; missing text[] := '{}';
BEGIN
  FOREACH rel IN ARRAY ARRAY[
    'aigas_agent_runs','aigas_agent_steps','aigas_tool_invocations',
    'aigas_checkpoints','aigas_tenant_memory','aigas_budget_reservations','aigas_outbox'
  ] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=rel AND c.relkind='r') THEN
      missing := missing || (rel || ':table'); END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relname=rel AND c.relrowsecurity AND c.relforcerowsecurity) THEN
      missing := missing || (rel || ':force-rls'); END IF;
    IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename=rel) < 2 THEN
      missing := missing || (rel || ':policies'); END IF;
  END LOOP;
  IF array_length(missing,1) > 0 THEN RAISE EXCEPTION 'FAIL catalog: %', missing; END IF;
  RAISE NOTICE 'PASS catalog: 7 tables, RLS+FORCE and >=2 policies each';
END $$;

DO $$
BEGIN
  IF to_regprocedure('public.aigas_agent_start(uuid)') IS NULL
     OR to_regprocedure('public.aigas_agent_read(uuid)') IS NULL THEN
    RAISE EXCEPTION 'FAIL signatures: start(uuid)/read(uuid) absent';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE 'aigas\_agent\_%'
      AND NOT (p.proconfig @> ARRAY['search_path=pg_catalog, public'])
  ) THEN RAISE EXCEPTION 'FAIL search_path: agent function without pinned search_path'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname LIKE 'aigas\_agent\_%'
      AND (has_function_privilege(to_regrole('authenticated'),p.oid,'EXECUTE')
        OR has_function_privilege(to_regrole('anonymous'),p.oid,'EXECUTE')
        OR has_function_privilege(to_regrole('aigas_app_login'),p.oid,'EXECUTE'))
  ) THEN RAISE EXCEPTION 'FAIL function ACL: client/login role has EXECUTE'; END IF;
  RAISE NOTICE 'PASS signatures/grants/search_path: start(uuid), read(uuid), pinned path';
END $$;

-- 1. Synthetic tenants and members. Owner writes fixtures, then runtime takes over.
INSERT INTO public.aigas_tenants(id,name) VALUES
  ('c1000000-0000-4000-8000-000000000001','Agent synthetic A'),
  ('c1000000-0000-4000-8000-000000000002','Agent synthetic B')
ON CONFLICT (id) DO NOTHING;
INSERT INTO neon_auth."user"(id,name,email,"emailVerified",banned) VALUES
  ('c2a00000-0000-4000-8000-000000000001','Agent Synthetic A','agent-a@example.test',true,false),
  ('c2a00000-0000-4000-8000-000000000002','Agent Synthetic B','agent-b@example.test',true,false)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES
  ('c1000000-0000-4000-8000-000000000001','c2a00000-0000-4000-8000-000000000001','OWNER'),
  ('c1000000-0000-4000-8000-000000000002','c2a00000-0000-4000-8000-000000000002','OWNER')
ON CONFLICT DO NOTHING;

SET LOCAL ROLE aigas_runtime;
SELECT set_config('aigas.tenant_id','c1000000-0000-4000-8000-000000000001',true);
SELECT set_config('aigas.user_id','c2a00000-0000-4000-8000-000000000001',true);

-- 2. start(uuid) is idempotent by request, read(uuid) returns sanitized fields.
DO $$
DECLARE r1 uuid; r2 uuid; payload jsonb; visible_b integer; accepted boolean := false;
BEGIN
  r1 := public.aigas_agent_start('c3000000-0000-4000-8000-000000000001');
  r2 := public.aigas_agent_start('c3000000-0000-4000-8000-000000000001');
  IF r1 IS DISTINCT FROM r2 THEN RAISE EXCEPTION 'FAIL replay: start returned two runs'; END IF;
  payload := public.aigas_agent_read(r1);
  IF payload->>'status' <> 'QUEUED' OR payload ? 'reasoning' OR payload ? 'secret' THEN
    RAISE EXCEPTION 'FAIL read payload: %', payload; END IF;

  SELECT count(*) INTO visible_b FROM public.aigas_agent_runs
   WHERE tenant_id='c1000000-0000-4000-8000-000000000002';
  IF visible_b <> 0 THEN RAISE EXCEPTION 'FAIL cross-tenant read: % rows', visible_b; END IF;

  BEGIN
    INSERT INTO public.aigas_agent_runs(id,tenant_id,actor_id,agent_key,policy_version,
      idempotency_key,request_fingerprint)
    VALUES ('c4000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000002',
      'c2a00000-0000-4000-8000-000000000001','kernel-agent','p2','cross','00000000000000000000000000000000');
    accepted := true;
  EXCEPTION WHEN insufficient_privilege OR check_violation OR raise_exception THEN NULL;
  END;
  IF accepted THEN RAISE EXCEPTION 'FAIL cross-tenant insert was accepted'; END IF;
  RAISE NOTICE 'PASS start/read replay, cross-tenant read=0 and insert refused';
END $$;

-- 3. Budget atomicity: same key+payload returns one reservation; changed payload conflicts.
DO $$
DECLARE run_id uuid; b1 uuid; b2 uuid; conflicted boolean := false; n integer;
BEGIN
  SELECT id INTO STRICT run_id FROM public.aigas_agent_runs
  WHERE idempotency_key='c3000000-0000-4000-8000-000000000001';
  b1 := public.aigas_agent_reserve_budget('c1000000-0000-4000-8000-000000000001',run_id,
    'firewall',7,'c5000000-0000-4000-8000-000000000001');
  b2 := public.aigas_agent_reserve_budget('c1000000-0000-4000-8000-000000000001',run_id,
    'firewall',7,'c5000000-0000-4000-8000-000000000001');
  IF b1 IS DISTINCT FROM b2 THEN RAISE EXCEPTION 'FAIL budget replay: two reservations'; END IF;
  BEGIN
    PERFORM public.aigas_agent_reserve_budget('c1000000-0000-4000-8000-000000000001',run_id,
      'firewall',9,'c5000000-0000-4000-8000-000000000001');
  EXCEPTION WHEN unique_violation OR raise_exception THEN conflicted := true;
  END;
  IF NOT conflicted THEN RAISE EXCEPTION 'FAIL budget fingerprint mismatch was accepted'; END IF;
  SELECT count(*) INTO n FROM public.aigas_budget_reservations
   WHERE tenant_id='c1000000-0000-4000-8000-000000000001' AND idempotency_key='c5000000-0000-4000-8000-000000000001';
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL budget atomicity: % rows', n; END IF;
  RAISE NOTICE 'PASS budget atomicity: one reservation, payload change conflicted';
END $$;

-- 4. No raw secret / hidden reasoning can be persisted in references.
DO $$
DECLARE accepted boolean := false;
BEGIN
  BEGIN
    INSERT INTO public.aigas_agent_steps(id,tenant_id,run_id,step_no,kind,status,summary,input_ref,policy_version,idempotency_key)
    SELECT gen_random_uuid(),tenant_id,id,2,'PLAN','PENDING',
      'short auditable step','api_key=hidden-secret','p2','bad-ref'
    FROM public.aigas_agent_runs WHERE idempotency_key='c3000000-0000-4000-8000-000000000001';
    accepted := true;
  EXCEPTION WHEN check_violation OR insufficient_privilege THEN NULL;
  END;
  IF accepted THEN RAISE EXCEPTION 'FAIL secret-like reference was accepted'; END IF;
  RAISE NOTICE 'PASS no-secret CHECK rejected a free-form reference';
END $$;

ROLLBACK;
SELECT 'PASS all P02 agent persistence checks; transaction rolled back' AS result;
