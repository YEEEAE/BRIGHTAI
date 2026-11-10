-- LOCAL DRAFT: requires 0026 and 0028; apply externally only with authorization.
BEGIN;
CREATE OR REPLACE FUNCTION public.aigas_re_guard_treatment() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_version integer; latest_assessment public.aigas_re_assessments%ROWTYPE; prior_version integer; membership_role text; expected_level text;
BEGIN
 SELECT version INTO current_version FROM public.aigas_re_assets WHERE tenant_id=NEW.tenant_id AND id=NEW.asset_id FOR UPDATE;
 SELECT * INTO latest_assessment FROM public.aigas_re_assessments WHERE tenant_id=NEW.tenant_id AND asset_id=NEW.asset_id ORDER BY created_at DESC,id DESC LIMIT 1;
 SELECT COALESCE(max(version),0) INTO prior_version FROM public.aigas_re_treatment_revisions WHERE tenant_id=NEW.tenant_id AND asset_id=NEW.asset_id;
 IF NEW.changed_by IS DISTINCT FROM public.aigas_actor() THEN
  RAISE EXCEPTION 'Treatment actor must match the authenticated actor';
 END IF;
 SELECT role INTO membership_role FROM public.aigas_lock_member(NEW.tenant_id,NEW.changed_by);
 IF current_version IS DISTINCT FROM NEW.asset_version OR latest_assessment.id IS DISTINCT FROM NEW.assessment_id OR latest_assessment.asset_version IS DISTINCT FROM current_version OR NEW.version<>prior_version+1 THEN
  RAISE EXCEPTION 'Treatment requires current asset, assessment and treatment revision';
 END IF;
 IF membership_role IS NULL OR membership_role NOT IN ('OWNER','ADMIN') OR membership_role<>NEW.actor_role THEN
  RAISE EXCEPTION 'Treatment actor is not authorized';
 END IF;
 IF NEW.residual_likelihood IS NOT NULL THEN
  IF NEW.residual_impact IS NULL OR NEW.residual_likelihood NOT BETWEEN 1 AND 3 OR NEW.residual_impact NOT BETWEEN 1 AND 3 THEN
   RAISE EXCEPTION 'Residual likelihood and impact must both be integers from 1 to 3';
  END IF;
  expected_level := CASE WHEN NEW.residual_likelihood*NEW.residual_impact<=2 THEN 'LOW' WHEN NEW.residual_likelihood*NEW.residual_impact<=4 THEN 'MEDIUM' ELSE 'HIGH' END;
  IF NEW.residual_score IS DISTINCT FROM NEW.residual_likelihood*NEW.residual_impact OR NEW.residual_level IS DISTINCT FROM expected_level THEN
   RAISE EXCEPTION 'Residual score and level must match the declared matrix';
  END IF;
 END IF;
 IF NEW.status IN ('MITIGATED','ACCEPTED') AND NEW.residual_level IS NULL THEN
  RAISE EXCEPTION 'Mitigation or acceptance requires a residual assessment';
 END IF;
 IF NEW.status='ACCEPTED' AND NEW.review_on IS NULL THEN
  RAISE EXCEPTION 'Acceptance requires a review date';
 END IF;
 IF NEW.status='ACCEPTED' AND NEW.acceptance_policy_version IS DISTINCT FROM 'risk-acceptance-policy-v1' THEN
  RAISE EXCEPTION 'Acceptance requires the declared policy version';
 END IF;
 -- Acceptance is an administrative decision with a recorded reason, not a score change.
 IF NEW.status='ACCEPTED' AND char_length(btrim(NEW.rationale))<20 THEN
  RAISE EXCEPTION 'Acceptance requires a recorded rationale of at least 20 characters';
 END IF;
 -- HIGH inherent or residual risk requires an OWNER independent of the evaluator.
 IF NEW.status='ACCEPTED' AND (latest_assessment.risk_level='HIGH' OR NEW.residual_level='HIGH') AND (membership_role<>'OWNER' OR latest_assessment.evaluator_id=NEW.changed_by) THEN
  RAISE EXCEPTION 'High risk acceptance requires an independent owner';
 END IF;
 RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.aigas_re_guard_treatment() FROM PUBLIC;
COMMIT;
