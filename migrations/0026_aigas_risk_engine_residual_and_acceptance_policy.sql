-- REVIEW ONLY — local draft, NOT applied to production or any Neon branch.
-- Requires 0005, 0008, 0015 and 0021 on an approved isolated target first.
-- Adds a human-entered residual 3×3 estimate and makes the acceptance policy explicit.
-- Existing rows are not rewritten; new CHECK constraints are added NOT VALID so a
-- deployment can validate old data separately after review.
BEGIN;

ALTER TABLE public.aigas_re_treatment_revisions
  ADD COLUMN residual_likelihood smallint,
  ADD COLUMN residual_impact smallint,
  ADD COLUMN residual_score smallint,
  ADD COLUMN residual_level text,
  ADD COLUMN acceptance_policy_version text;

-- A residual estimate is either absent or complete and consistent with the same
-- deterministic likelihood × impact rule used for the inherent assessment.
ALTER TABLE public.aigas_re_treatment_revisions
  ADD CONSTRAINT aigas_re_residual_pair_check CHECK (
    (residual_likelihood IS NULL AND residual_impact IS NULL AND residual_score IS NULL AND residual_level IS NULL)
    OR (
      residual_likelihood IS NOT NULL
      AND residual_impact IS NOT NULL
      AND residual_likelihood BETWEEN 1 AND 3
      AND residual_impact BETWEEN 1 AND 3
      AND residual_score IS NOT NULL
      AND residual_score = residual_likelihood * residual_impact
      AND residual_level IS NOT NULL
      AND residual_level = CASE
        WHEN residual_likelihood * residual_impact <= 2 THEN 'LOW'
        WHEN residual_likelihood * residual_impact <= 4 THEN 'MEDIUM'
        ELSE 'HIGH'
      END
    )
  ) NOT VALID;

-- A plan may only claim mitigation or acceptance when residual risk is assessed.
ALTER TABLE public.aigas_re_treatment_revisions
  ADD CONSTRAINT aigas_re_treatment_residual_required_check
  CHECK (status NOT IN ('MITIGATED','ACCEPTED') OR residual_level IS NOT NULL) NOT VALID;

-- Acceptance is time-bounded and tied to one declared product policy version.
ALTER TABLE public.aigas_re_treatment_revisions
  ADD CONSTRAINT aigas_re_acceptance_review_required_check
  CHECK (status <> 'ACCEPTED' OR review_on IS NOT NULL) NOT VALID;

ALTER TABLE public.aigas_re_treatment_revisions
  ADD CONSTRAINT aigas_re_acceptance_policy_version_check
  CHECK (status <> 'ACCEPTED' OR (acceptance_policy_version IS NOT NULL AND acceptance_policy_version = 'risk-acceptance-policy-v1')) NOT VALID;

-- Supersedes the 0021 function with the same separation-of-duties checks plus the
-- residual and review-date requirements. The service performs the same checks first.
CREATE OR REPLACE FUNCTION public.aigas_re_guard_treatment() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_version integer; latest_assessment public.aigas_re_assessments%ROWTYPE; prior_version integer; membership_role text; expected_level text;
BEGIN
 SELECT version INTO current_version FROM public.aigas_re_assets WHERE tenant_id=NEW.tenant_id AND id=NEW.asset_id FOR UPDATE;
 SELECT * INTO latest_assessment FROM public.aigas_re_assessments WHERE tenant_id=NEW.tenant_id AND asset_id=NEW.asset_id ORDER BY created_at DESC,id DESC LIMIT 1;
 SELECT COALESCE(max(version),0) INTO prior_version FROM public.aigas_re_treatment_revisions WHERE tenant_id=NEW.tenant_id AND asset_id=NEW.asset_id;
 SELECT role INTO membership_role FROM public.aigas_memberships WHERE tenant_id=NEW.tenant_id AND user_id=NEW.changed_by FOR SHARE;
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
