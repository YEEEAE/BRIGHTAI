-- Add bounded provider usage fields without rewriting existing sealed events.
BEGIN;
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
      AND metadata_json - ARRAY['synthetic','audit_ref','action','evidence_policy_version','run_ref','correlation_ref','causation_ref','agent_version','provider_name','provider_model','usage_input','usage_output','usage_total']='{}'::jsonb
      AND (NOT (metadata_json ? 'provider_name') OR metadata_json->>'provider_name' ~ '^[A-Za-z0-9_.:-]{1,80}$')
      AND (NOT (metadata_json ? 'provider_model') OR metadata_json->>'provider_model' ~ '^[A-Za-z0-9_.:/-]{1,100}$')
      AND (NOT (metadata_json ? 'usage_input') OR metadata_json->>'usage_input' ~ '^(0|[1-9][0-9]{0,8})$')
      AND (NOT (metadata_json ? 'usage_output') OR metadata_json->>'usage_output' ~ '^(0|[1-9][0-9]{0,8})$')
      AND (NOT (metadata_json ? 'usage_total') OR metadata_json->>'usage_total' ~ '^(0|[1-9][0-9]{0,8})$')
      AND (NOT (metadata_json ? 'run_ref') OR metadata_json->>'run_ref' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
      AND (NOT (metadata_json ? 'correlation_ref') OR metadata_json->>'correlation_ref' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
      AND (NOT (metadata_json ? 'causation_ref') OR metadata_json->>'causation_ref' ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
      AND (NOT (metadata_json ? 'agent_version') OR metadata_json->>'agent_version' ~ '^[a-zA-Z0-9_.:-]{1,120}$')
      AND metadata_json->'synthetic'='false'::jsonb
      AND char_length(metadata_json->>'action')<=100
      AND (metadata_json->>'action') ~ '^(workspace[.]created|kernel[.][a-z_.-]+)$'
    ELSE false END
) IS TRUE) NOT VALID;
COMMIT;
