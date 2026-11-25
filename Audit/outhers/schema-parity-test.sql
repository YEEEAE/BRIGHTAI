-- psql -X --single-transaction -v ON_ERROR_STOP=1 -f Audit/schema-parity-test.sql
-- Run on approved staging or a disposable local database as an operator that
-- can seed fixtures and SET ROLE aigas_runtime. The inner subtransaction always
-- rolls back. The result is returned by the final SELECT in the same transaction.
DO $parity$
DECLARE
  actor uuid := gen_random_uuid();
  tenant uuid := gen_random_uuid();
  foreign_tenant uuid := gen_random_uuid();
  decision text;
  seq integer := 0;
  parent text;
  next_hash text;
  payload jsonb;
  failed_constraint text;
  rollback_message text;
BEGIN
  BEGIN
    INSERT INTO neon_auth."user"(id, name, email, "emailVerified")
    VALUES (actor, 'Schema parity fixture', actor::text || '@example.invalid', false);
    INSERT INTO public.aigas_tenants(id, name)
    VALUES (tenant, 'Schema parity A'), (foreign_tenant, 'Schema parity B');
    INSERT INTO public.aigas_memberships(tenant_id, user_id, role) VALUES (tenant, actor, 'OWNER');
    INSERT INTO public.aigas_ld_events
      (event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,
       hash_profile,sequence_no,previous_hash,idempotency_key,integrity_hash)
    VALUES (gen_random_uuid(), foreign_tenant, 'firewall','firewall.decision.recorded','parity-fixture',
      jsonb_build_object('synthetic',true,'decision_ref',gen_random_uuid(),'action','ALLOW',
        'mode','LAB','rule_ref',null,'rule_version',null), now(),actor,
      'aigas-ledger-sha256-chain-v2',1,NULL,'parity:foreign-seed',repeat('f',64));

    PERFORM set_config('aigas.user_id', actor::text, true);
    PERFORM set_config('aigas.tenant_id', tenant::text, true);
    SET LOCAL ROLE aigas_runtime;
    IF current_user <> 'aigas_runtime' OR NOT row_security_active('public.aigas_ld_events')
       OR public.aigas_tenant_scope(tenant) IS DISTINCT FROM true
       OR public.aigas_is_tenant_member(foreign_tenant) IS DISTINCT FROM false
       OR EXISTS (SELECT 1 FROM public.aigas_ld_events WHERE tenant_id = foreign_tenant) THEN
      RAISE EXCEPTION 'Unexpected tenant scope or cross-tenant read';
    END IF;

    FOREACH decision IN ARRAY ARRAY['ALLOW','WARN','REDACT','ESCALATE','DENY','BLOCK','bad-fingerprint','foreign'] LOOP
      next_hash := lpad((seq+1)::text,64,'0');
      payload := jsonb_build_object('synthetic',true,'decision_ref',gen_random_uuid(),
        'action', CASE WHEN decision IN ('bad-fingerprint','foreign') THEN 'DENY' ELSE decision END,
        'mode','GUARD','rule_ref',NULL,'rule_version',NULL,
        'request_fingerprint',CASE WHEN decision='bad-fingerprint' THEN 'invalid' ELSE repeat('a',64) END);
      BEGIN
        INSERT INTO public.aigas_ld_events
          (event_id,tenant_id,source,event_type,policy_version,metadata_json,created_at,created_by,
           hash_profile,sequence_no,previous_hash,idempotency_key,integrity_hash)
        VALUES (gen_random_uuid(),CASE WHEN decision='foreign' THEN foreign_tenant ELSE tenant END,
          'firewall','firewall.decision.recorded','parity-fixture',payload,now(),actor,
          'aigas-ledger-sha256-chain-v2',CASE WHEN decision='foreign' THEN 1 ELSE seq+1 END,
          CASE WHEN decision='foreign' THEN NULL ELSE parent END,
          'parity:'||decision,next_hash);
        IF decision IN ('BLOCK','bad-fingerprint','foreign') THEN
          RAISE EXCEPTION 'Unexpected acceptance: %',decision;
        END IF;
        seq := seq+1;
        parent := next_hash;
      EXCEPTION
        WHEN check_violation THEN
          GET STACKED DIAGNOSTICS failed_constraint = CONSTRAINT_NAME;
          IF decision NOT IN ('BLOCK','bad-fingerprint') OR failed_constraint <> 'aigas_ld_events_check' THEN RAISE; END IF;
        WHEN insufficient_privilege THEN
          IF decision <> 'foreign' THEN RAISE; END IF;
          GET STACKED DIAGNOSTICS rollback_message = MESSAGE_TEXT;
          IF rollback_message NOT LIKE '%row-level security%' THEN RAISE; END IF;
      END;
    END LOOP;
    IF seq <> 5 OR (SELECT count(*) FROM public.aigas_ld_events WHERE tenant_id=tenant) <> 5 THEN
      RAISE EXCEPTION 'Expected five accepted and visible decisions';
    END IF;

    BEGIN
      INSERT INTO public.aigas_fw_decisions(id, tenant_id, action, reason, mode, request_id)
      VALUES (gen_random_uuid(),tenant,'DENY','NO_MATCH_ENFORCED','GUARD',gen_random_uuid());
      RAISE EXCEPTION 'Unexpected GUARD acceptance without binding';
    EXCEPTION WHEN check_violation THEN
      GET STACKED DIAGNOSTICS failed_constraint = CONSTRAINT_NAME;
      IF failed_constraint NOT IN ('aigas_fw_decisions_check2','aigas_fw_decisions_guard_binding_check') THEN RAISE; END IF;
    END;

    RAISE SQLSTATE 'P0050' USING MESSAGE = 'rollback schema parity fixtures';
  EXCEPTION WHEN SQLSTATE 'P0050' THEN
    GET STACKED DIAGNOSTICS rollback_message = MESSAGE_TEXT;
    IF rollback_message <> 'rollback schema parity fixtures' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM public.aigas_tenants WHERE id IN (tenant, foreign_tenant))
     OR EXISTS (SELECT 1 FROM neon_auth."user" WHERE id=actor)
     OR EXISTS (SELECT 1 FROM public.aigas_ld_events WHERE tenant_id IN (tenant, foreign_tenant))
     OR EXISTS (SELECT 1 FROM public.aigas_fw_decisions WHERE tenant_id IN (tenant, foreign_tenant)) THEN
    RAISE EXCEPTION 'Synthetic fixtures remain after rollback';
  END IF;
  PERFORM set_config('parity.result', '5/5; BLOCK and malformed fingerprint rejected; cross-tenant read/write denied; missing GUARD binding rejected; fixtures rolled back', true);
END
$parity$;

-- PARITY RESULT
SELECT current_setting('parity.result') AS result;
