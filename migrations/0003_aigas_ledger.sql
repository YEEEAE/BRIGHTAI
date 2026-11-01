-- Fresh-install migration: 0003 was not applied on the inspected Neon branch.
-- REVIEW ONLY: requires 0001; apply only to an approved isolated development DB.
-- Access/grants for ingestion require 0006; no license is activated by this SQL.
BEGIN;
CREATE TABLE public.aigas_ld_events (
  event_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  source text NOT NULL CHECK (source IN ('ledger.synthetic-lab','firewall','human-gate','risk-engine','kernel')),
  event_type text NOT NULL,
  policy_version text NOT NULL CHECK (policy_version ~ '^[a-zA-Z0-9_.:-]{1,120}$'),
  metadata_json jsonb NOT NULL CHECK ((
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
        AND metadata_json - ARRAY['synthetic','decision_ref','action','mode','rule_ref','rule_version','evidence_policy_version']='{}'::jsonb
        AND metadata_json->'synthetic'='true'::jsonb
        AND metadata_json->>'action' IN ('ALLOW','BLOCK','REDACT')
        AND metadata_json->>'mode' IN ('LAB','GUARD')
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
  ) IS TRUE),
  CHECK (coalesce(metadata_json->>'decision_ref','00000000-0000-0000-0000-000000000000') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  CHECK (coalesce(metadata_json->>'request_ref','00000000-0000-0000-0000-000000000000') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  CHECK (coalesce(metadata_json->>'asset_ref','00000000-0000-0000-0000-000000000000') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  CHECK (coalesce(metadata_json->>'assessment_ref','00000000-0000-0000-0000-000000000000') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  CHECK (coalesce(metadata_json->>'audit_ref','00000000-0000-0000-0000-000000000000') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  created_at timestamptz(3) NOT NULL,
  created_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  hash_profile text NOT NULL CHECK (hash_profile='aigas-ledger-sha256-chain-v2'),
  sequence_no bigint NOT NULL CHECK (sequence_no>0),
  previous_hash text CHECK (previous_hash ~ '^[0-9a-f]{64}$'),
  idempotency_key text NOT NULL CHECK (idempotency_key ~ '^[a-zA-Z0-9_.:-]{1,180}$'),
  integrity_hash text NOT NULL CHECK (integrity_hash ~ '^[0-9a-f]{64}$'),
  CHECK ((sequence_no=1 AND previous_hash IS NULL) OR (sequence_no>1 AND previous_hash IS NOT NULL)),
  UNIQUE(tenant_id,sequence_no),
  UNIQUE(tenant_id,source,idempotency_key),
  UNIQUE(tenant_id,integrity_hash),
  FOREIGN KEY(tenant_id,previous_hash) REFERENCES public.aigas_ld_events(tenant_id,integrity_hash)
);
CREATE INDEX aigas_ld_tenant_time_idx ON public.aigas_ld_events(tenant_id,created_at DESC,event_id DESC);
CREATE INDEX aigas_ld_tenant_source_idx ON public.aigas_ld_events(tenant_id,source,sequence_no DESC);
CREATE FUNCTION public.aigas_ld_events_reject_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Ledger evidence rows are append-only';
END;
$$;
REVOKE ALL ON FUNCTION public.aigas_ld_events_reject_mutation() FROM PUBLIC;
CREATE TRIGGER aigas_ld_events_append_only BEFORE UPDATE OR DELETE ON public.aigas_ld_events
FOR EACH ROW EXECUTE FUNCTION public.aigas_ld_events_reject_mutation();
CREATE TRIGGER aigas_ld_events_no_truncate BEFORE TRUNCATE ON public.aigas_ld_events
FOR EACH STATEMENT EXECUTE FUNCTION public.aigas_ld_events_reject_mutation();

-- Empty by default. Only an authorized operator may configure mandatory evidence
-- from an approved policy. No client endpoint, default requirement or fallback.
CREATE TABLE public.aigas_ld_evidence_requirements (
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  source text NOT NULL CHECK (source IN ('firewall','human-gate','risk-engine','kernel')),
  event_type text NOT NULL CHECK (event_type IN ('firewall.decision.recorded','human_gate.request.created','human_gate.decision.recorded','human_gate.demo_note.completed','risk_engine.asset.created','risk_engine.asset.updated','risk_engine.assessment.created','kernel.audit.recorded')),
  CHECK (CASE source WHEN 'firewall' THEN event_type='firewall.decision.recorded' WHEN 'human-gate' THEN event_type IN ('human_gate.request.created','human_gate.decision.recorded','human_gate.demo_note.completed') WHEN 'risk-engine' THEN event_type IN ('risk_engine.asset.created','risk_engine.asset.updated','risk_engine.assessment.created') WHEN 'kernel' THEN event_type='kernel.audit.recorded' ELSE false END),
  policy_version text NOT NULL CHECK (policy_version ~ '^[a-zA-Z0-9_.:-]{1,120}$'),
  approval_reference text NOT NULL CHECK (char_length(btrim(approval_reference)) BETWEEN 1 AND 160),
  approved_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  approved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,source,event_type)
);
REVOKE ALL ON public.aigas_ld_events,public.aigas_ld_evidence_requirements FROM PUBLIC;
ALTER TABLE public.aigas_ld_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_ld_evidence_requirements ENABLE ROW LEVEL SECURITY;
-- Runtime: SELECT/INSERT events only; SELECT requirements only. No browser/Data API grants.
-- No independent signing, external anchor, admin-proof storage, legal hold or retention promise.
-- An existing installation of an older 0003 needs a separately reviewed upgrade;
-- never recompute old hashes or silently rewrite its historical evidence in place.
COMMIT;
