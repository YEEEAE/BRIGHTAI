-- REVIEW ONLY — local draft, NOT applied to production or any Neon branch.
-- Requires 0005, 0008 and 0015 on an approved isolated development target first.
-- Adds defense in depth for acceptance without changing existing rows, grants or RLS.
BEGIN;

CREATE OR REPLACE FUNCTION public.aigas_re_guard_treatment() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_version integer; latest_assessment public.aigas_re_assessments%ROWTYPE; prior_version integer; membership_role text;
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
 -- Acceptance is an administrative decision with a recorded reason, not a score change.
 IF NEW.status='ACCEPTED' AND char_length(btrim(NEW.rationale))<20 THEN
  RAISE EXCEPTION 'Acceptance requires a recorded rationale of at least 20 characters';
 END IF;
 IF NEW.status='ACCEPTED' AND latest_assessment.risk_level='HIGH' AND (membership_role<>'OWNER' OR latest_assessment.evaluator_id=NEW.changed_by) THEN
  RAISE EXCEPTION 'High risk acceptance requires an independent owner';
 END IF;
 RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.aigas_re_guard_treatment() FROM PUBLIC;

COMMIT;
