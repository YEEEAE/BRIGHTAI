-- Adds immutable references to code-owned matchers alongside legacy literal rules.
BEGIN;
ALTER TABLE public.aigas_fw_decisions
 ADD COLUMN matcher_id text,
 ADD COLUMN matcher_version integer,
 ADD CONSTRAINT aigas_fw_decisions_matcher_ref_check CHECK (
  (matcher_id IS NULL) = (matcher_version IS NULL)
  AND (matcher_id IS NULL OR (matcher_id ~ '^[a-z][a-z0-9-]{1,63}$' AND matcher_version > 0 AND rule_id IS NULL))
 );

-- The legacy upgrade names this check explicitly, while fresh installs use
-- PostgreSQL's generated name. Replace just the reference-presence constraint.
DO $$ DECLARE target name; BEGIN
 SELECT conname INTO STRICT target FROM pg_constraint
 WHERE conrelid='public.aigas_fw_decisions'::regclass AND contype='c'
 AND pg_get_constraintdef(oid) LIKE '%RULE_ALLOW%rule_id IS NOT NULL%';
 EXECUTE format('ALTER TABLE public.aigas_fw_decisions DROP CONSTRAINT %I',target);
END $$;
ALTER TABLE public.aigas_fw_decisions ADD CONSTRAINT aigas_fw_decisions_rule_ref_check
 CHECK ((reason IN ('RULE_DENY','RULE_ESCALATE','RULE_REDACT','RULE_WARN','RULE_ALLOW'))
  = (rule_id IS NOT NULL OR matcher_id IS NOT NULL));

CREATE OR REPLACE FUNCTION public.aigas_fw_review_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.operation_type='FIREWALL_ESCALATION_REVIEW' THEN
  IF NEW.payload - ARRAY['decision_id','rule_id','rule_version','request_fingerprint'] <> '{}'::jsonb
   OR NOT (NEW.payload ?& ARRAY['decision_id','rule_id','rule_version','request_fingerprint'])
   OR NEW.title<>'Firewall escalation review' OR NEW.description<>'Metadata-only policy review'
   OR NEW.reason<>'Independent review required' OR NEW.provider_ref<>'aigas-kernel'
  THEN RAISE EXCEPTION 'Metadata-only Firewall payload required' USING ERRCODE='23514'; END IF;
  IF NEW.status IN ('PENDING','APPROVED','EXECUTED') AND NOT EXISTS (
   SELECT 1 FROM public.aigas_fw_decisions d
   LEFT JOIN public.aigas_fw_rules r ON r.tenant_id=d.tenant_id AND r.id=d.rule_id
   JOIN public.aigas_hg_policies p ON p.tenant_id=d.tenant_id
   WHERE d.tenant_id=NEW.tenant_id AND d.id=NEW.subject_ref AND d.action='ESCALATE' AND d.mode='GUARD'
    AND NEW.payload=jsonb_build_object('decision_id',d.id,'rule_id',coalesce(d.rule_id::text,d.matcher_id),
       'rule_version',coalesce(d.rule_version,d.matcher_version),'request_fingerprint',d.request_fingerprint)
    AND (d.matcher_id IS NOT NULL OR (r.version=d.rule_version AND r.enabled))
    AND p.enabled AND p.firewall_escalation_enabled AND p.version::text=NEW.policy_version
  ) THEN RAISE EXCEPTION 'Firewall review binding no longer current' USING ERRCODE='23514'; END IF;
  IF NEW.status='EXECUTED' THEN RAISE EXCEPTION 'Provider execution adapter required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
COMMIT;
