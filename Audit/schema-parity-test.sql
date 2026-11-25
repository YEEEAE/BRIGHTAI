-- psql -X -v ON_ERROR_STOP=1 -v actor=<synthetic-member-uuid> \
--   -v tenant=<their-empty-ledger-tenant-uuid> -v foreign_tenant=<other-existing-tenant> \
--   -f Audit/schema-parity-test.sql
-- Approved disposable staging only. The actor must not belong to foreign_tenant.
BEGIN;
SELECT set_config('aigas.user_id', :'actor', true),
       set_config('aigas.tenant_id', :'tenant', true),
       set_config('parity.foreign_tenant', :'foreign_tenant', true);
SET LOCAL ROLE aigas_runtime;
DO $$
DECLARE
  tenant uuid := current_setting('aigas.tenant_id')::uuid;
  actor uuid := current_setting('aigas.user_id')::uuid;
  foreign_tenant uuid := current_setting('parity.foreign_tenant')::uuid;
  decision text;
  seq int := 0;
  parent text := NULL;
  next_hash text;
  payload jsonb;
  failed_constraint text;
BEGIN
  IF public.aigas_tenant_scope(tenant) IS DISTINCT FROM true
     OR foreign_tenant = tenant
     OR public.aigas_is_tenant_member(foreign_tenant)
     OR EXISTS (SELECT 1 FROM public.aigas_ld_events WHERE tenant_id=tenant) THEN
    RAISE EXCEPTION 'Expected an empty synthetic tenant and a distinct non-member tenant';
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
    END;
  END LOOP;
  IF seq <> 5 THEN RAISE EXCEPTION 'Expected five accepted decisions'; END IF;
  RAISE NOTICE '5/5 Ledger inserts; BLOCK, malformed fingerprint and cross-tenant insert rejected';
END $$;
ROLLBACK;
