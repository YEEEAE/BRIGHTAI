-- REVIEWED UPGRADE: Ledger 0003 (three Firewall states, no execution fingerprint)
-- -> current five-state metadata contract + write-time chain-link guard.
-- Apply only to a database that already has 0003 applied. A fresh install should
-- use the current 0003_aigas_ledger.sql. This file is local and NOT applied here.
-- No prompt, output, secret or customer content is read or written by this SQL.
BEGIN;

-- 1) Replace the metadata contract. Production still names it aigas_ld_events_check.
-- NOT VALID leaves already-sealed rows readable and untouched: append-only evidence is
-- never rewritten to satisfy a newer vocabulary. The contract applies to every new
-- insert. Run VALIDATE separately only if the operator proves no legacy rows exist.
ALTER TABLE public.aigas_ld_events DROP CONSTRAINT IF EXISTS aigas_ld_events_check;
ALTER TABLE public.aigas_ld_events ADD CONSTRAINT aigas_ld_events_check CHECK ((
  jsonb_typeof(metadata_json)='object' AND octet_length(metadata_json::text)<=1024
  AND jsonb_typeof(metadata_json->'synthetic')='boolean'
  AND (NOT (metadata_json ? 'evidence_policy_version') OR metadata_json->>'evidence_policy_version' ~ '^[a-zA-Z0-9_.:-]{1,120}$')
  AND CASE source
    WHEN 'ledger.synthetic-lab' THEN
      event_type IN ('synthetic.test.created','synthetic.review.recorded')
      AND metadata_json ?& ARRAY['synthetic','scenario','outcome','decision_ref']
      AND metadata_json - ARRAY['synthetic','scenario','outcome','decision_ref','evidence_policy_version']='{}'::jsonb
      AND metadata_json->'synthetic'='true'::jsonb
      AND metadata_json->>'scenario' IN ('integrity-check','access-check')
      AND metadata_json->>'outcome' IN ('RECORDED','REVIEWED')
    WHEN 'firewall' THEN
      event_type='firewall.decision.recorded'
      AND metadata_json ?& ARRAY['synthetic','decision_ref','action','mode','rule_ref','rule_version']
      AND metadata_json - ARRAY['synthetic','decision_ref','action','mode','rule_ref','rule_version','request_fingerprint','evidence_policy_version']='{}'::jsonb
      AND metadata_json->'synthetic'='true'::jsonb
      AND metadata_json->>'action' IN ('ALLOW','WARN','REDACT','ESCALATE','DENY')
      AND metadata_json->>'mode' IN ('LAB','GUARD')
      AND (NOT (metadata_json ? 'request_fingerprint') OR metadata_json->>'request_fingerprint' ~ '^[0-9a-f]{64}$')
    WHEN 'human-gate' THEN
      event_type IN ('human_gate.request.created','human_gate.decision.recorded','human_gate.demo_note.completed')
      AND metadata_json ?& ARRAY['synthetic','request_ref','operation_scope']
      AND metadata_json - ARRAY['synthetic','request_ref','decision_ref','decision','operation_scope','evidence_policy_version']='{}'::jsonb
      AND metadata_json->'synthetic'='true'::jsonb
      AND metadata_json->>'operation_scope'='INTERNAL_DEMO_NOTE'
      AND (event_type<>'human_gate.decision.recorded' OR (metadata_json ?& ARRAY['decision_ref','decision'] AND metadata_json->>'decision' IN ('APPROVE','REJECT')))
    WHEN 'risk-engine' THEN
      event_type IN ('risk_engine.asset.created','risk_engine.asset.updated','risk_engine.assessment.created')
      AND metadata_json ?& ARRAY['synthetic','asset_ref','asset_version']
      AND metadata_json - ARRAY['synthetic','asset_ref','asset_version','assessment_ref','risk_level','evidence_policy_version']='{}'::jsonb
      AND metadata_json->'synthetic'='false'::jsonb
      AND (metadata_json->>'asset_version') ~ '^[1-9][0-9]*$'
      AND (event_type<>'risk_engine.assessment.created' OR (metadata_json ?& ARRAY['assessment_ref','risk_level'] AND metadata_json->>'risk_level' IN ('LOW','MEDIUM','HIGH')))
    WHEN 'kernel' THEN
      event_type='kernel.audit.recorded'
      AND metadata_json ?& ARRAY['synthetic','audit_ref','action']
      AND metadata_json - ARRAY['synthetic','audit_ref','action','evidence_policy_version']='{}'::jsonb
      AND metadata_json->'synthetic'='false'::jsonb
      AND char_length(metadata_json->>'action')<=100
      AND (metadata_json->>'action') ~ '^(workspace[.]created|kernel[.][a-z_.-]+)$'
    ELSE false END
) IS TRUE) NOT VALID;

-- 2) Enforce the parent link at insert time, so a missing or forked sequence is
-- rejected by the database instead of only being discovered during verification.
CREATE OR REPLACE FUNCTION public.aigas_ld_events_chain_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE parent public.aigas_ld_events%ROWTYPE;
BEGIN
  IF NEW.sequence_no=1 THEN
    IF NEW.previous_hash IS NOT NULL THEN RAISE EXCEPTION 'Ledger genesis must not reference a previous hash'; END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO parent FROM public.aigas_ld_events
    WHERE tenant_id=NEW.tenant_id AND sequence_no=NEW.sequence_no-1;
  IF NOT FOUND OR parent.integrity_hash IS DISTINCT FROM NEW.previous_hash THEN
    RAISE EXCEPTION 'Ledger sequence gap or wrong previous hash';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.aigas_ld_events_chain_guard() FROM PUBLIC;
DROP TRIGGER IF EXISTS aigas_ld_events_chain_guard ON public.aigas_ld_events;
CREATE TRIGGER aigas_ld_events_chain_guard BEFORE INSERT ON public.aigas_ld_events
FOR EACH ROW EXECUTE FUNCTION public.aigas_ld_events_chain_guard();

COMMIT;
