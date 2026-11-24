-- Default-off review of the current HIGH assessment. Review has no execution grant.
BEGIN;
ALTER TABLE public.aigas_hg_policies ADD COLUMN risk_assessment_review_enabled boolean NOT NULL DEFAULT false;

DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conname,pg_get_constraintdef(oid) AS definition
 FROM pg_constraint
 WHERE contype='c' AND conrelid='public.aigas_hg_requests'::regclass
 AND pg_get_constraintdef(oid) LIKE '%FIREWALL_ESCALATION_REVIEW%' LOOP
  EXECUTE format('ALTER TABLE public.aigas_hg_requests DROP CONSTRAINT %I',c.conname);
  EXECUTE format('ALTER TABLE public.aigas_hg_requests ADD CONSTRAINT %I %s',c.conname,
   replace(c.definition,'''FIREWALL_ESCALATION_REVIEW''::text','''FIREWALL_ESCALATION_REVIEW''::text, ''RISK_ASSESSMENT_REVIEW''::text'));
 END LOOP;
END $$;

CREATE UNIQUE INDEX aigas_hg_risk_assessment_once ON public.aigas_hg_requests(tenant_id,subject_ref)
 WHERE operation_type='RISK_ASSESSMENT_REVIEW';

CREATE FUNCTION public.aigas_re_review_current(tid uuid, assessment_id uuid, requester uuid, evidence jsonb)
RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog,public AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.aigas_re_assessments s
  JOIN public.aigas_re_assets a ON a.tenant_id=s.tenant_id AND a.id=s.asset_id
  WHERE s.tenant_id=tid AND s.id=assessment_id AND s.evaluator_id=requester AND s.risk_level='HIGH'
   AND a.lifecycle_status='ACTIVE' AND a.version=s.asset_version
   AND evidence=jsonb_build_object('asset_id',a.id,'asset_version',a.version,'method_version',s.method_version)
   AND s.id=(SELECT latest.id FROM public.aigas_re_assessments latest
     WHERE latest.tenant_id=a.tenant_id AND latest.asset_id=a.id
     ORDER BY latest.created_at DESC,latest.id DESC LIMIT 1)
 );
$$;
REVOKE ALL ON FUNCTION public.aigas_re_review_current(uuid,uuid,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aigas_re_review_current(uuid,uuid,uuid,jsonb) TO aigas_runtime;

CREATE FUNCTION public.aigas_hg_risk_review_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.operation_type='RISK_ASSESSMENT_REVIEW' THEN
  IF NEW.status='EXECUTED' OR NEW.provider_ref IS DISTINCT FROM 'aigas-kernel'
   OR NEW.title IS DISTINCT FROM 'Risk assessment review'
   OR NEW.description IS DISTINCT FROM 'Metadata-only assessment review'
   OR NEW.reason IS DISTINCT FROM 'Independent review required'
  THEN RAISE EXCEPTION 'Risk assessment review has no execution effect' USING ERRCODE='23514'; END IF;
  IF NEW.status IN ('PENDING','APPROVED') AND (
   NOT public.aigas_re_review_current(NEW.tenant_id,NEW.subject_ref,NEW.requester_id,NEW.payload)
   OR NOT EXISTS (SELECT 1 FROM public.aigas_hg_policies p WHERE p.tenant_id=NEW.tenant_id
    AND p.enabled AND p.risk_assessment_review_enabled AND p.version::text=NEW.policy_version)
  ) THEN RAISE EXCEPTION 'Risk assessment review binding no longer current' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.aigas_hg_risk_review_guard() FROM PUBLIC;
CREATE TRIGGER aigas_hg_risk_review_guard BEFORE INSERT OR UPDATE ON public.aigas_hg_requests
 FOR EACH ROW EXECUTE FUNCTION public.aigas_hg_risk_review_guard();

CREATE FUNCTION public.aigas_hg_risk_decision_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.requester_id=NEW.reviewer_id AND EXISTS (SELECT 1 FROM public.aigas_hg_requests r
  WHERE r.tenant_id=NEW.tenant_id AND r.id=NEW.request_id AND r.operation_type='RISK_ASSESSMENT_REVIEW')
 THEN RAISE EXCEPTION 'Risk assessment review requires an independent reviewer' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.aigas_hg_risk_decision_guard() FROM PUBLIC;
CREATE TRIGGER aigas_hg_risk_decision_guard BEFORE INSERT ON public.aigas_hg_decisions
 FOR EACH ROW EXECUTE FUNCTION public.aigas_hg_risk_decision_guard();

DO $$
DECLARE client_role text;
BEGIN
 FOREACH client_role IN ARRAY ARRAY['authenticated','anonymous'] LOOP
  IF to_regrole(client_role) IS NOT NULL THEN
   EXECUTE format('REVOKE ALL ON FUNCTION public.aigas_re_review_current(uuid,uuid,uuid,jsonb),
    public.aigas_hg_risk_review_guard(), public.aigas_hg_risk_decision_guard() FROM %I',client_role);
  END IF;
 END LOOP;
END $$;
COMMIT;
