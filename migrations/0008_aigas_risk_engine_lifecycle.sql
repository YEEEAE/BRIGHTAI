-- Additive successor to 0005; apply both on an approved development target only.
-- Existing assessments/revisions are retained; no sample data, grants or product activation.
BEGIN;
ALTER TABLE public.aigas_re_assessments
 ADD COLUMN method_name text NOT NULL DEFAULT 'مسودة مصفوفة الاحتمال × الأثر 3×3',
 ADD COLUMN evidence_references text NOT NULL DEFAULT '' CHECK(char_length(evidence_references)<=1000),
 ADD COLUMN previous_assessment_id uuid,
 ADD CONSTRAINT aigas_re_assessment_scope UNIQUE(tenant_id,asset_id,id),
 ADD CONSTRAINT aigas_re_assessment_version_scope UNIQUE(tenant_id,asset_id,asset_version,id),
 ADD CONSTRAINT aigas_re_assessment_parent FOREIGN KEY(tenant_id,asset_id,previous_assessment_id)
 REFERENCES public.aigas_re_assessments(tenant_id,asset_id,id),
 ADD CONSTRAINT aigas_re_assessment_not_self CHECK(previous_assessment_id IS DISTINCT FROM id);
-- Each row is a complete treatment revision. Acceptance never modifies an assessment.
CREATE TABLE public.aigas_re_treatment_revisions (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL,
 asset_id uuid NOT NULL,
 asset_version integer NOT NULL CHECK(asset_version>0),
 assessment_id uuid NOT NULL,
 version integer NOT NULL CHECK(version>0),
 owner text NOT NULL CHECK(char_length(btrim(owner)) BETWEEN 2 AND 120),
 status text NOT NULL CHECK(status IN ('OPEN','IN_PROGRESS','MITIGATED','ACCEPTED')),
 control_description text NOT NULL CHECK(char_length(btrim(control_description)) BETWEEN 2 AND 500),
 review_on date,
 rationale text NOT NULL CHECK(char_length(btrim(rationale)) BETWEEN 2 AND 500),
 changed_by uuid NOT NULL REFERENCES neon_auth."user"(id),
 actor_role text NOT NULL CHECK(actor_role IN ('OWNER','ADMIN')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(tenant_id,asset_id,version),
 FOREIGN KEY(tenant_id,asset_id) REFERENCES public.aigas_re_assets(tenant_id,id),
 FOREIGN KEY(tenant_id,asset_id,asset_version,assessment_id)
 REFERENCES public.aigas_re_assessments(tenant_id,asset_id,asset_version,id)
);
CREATE INDEX aigas_re_treatment_history_idx ON public.aigas_re_treatment_revisions(tenant_id,asset_id,version DESC);
CREATE TRIGGER aigas_re_treatment_append_only BEFORE UPDATE OR DELETE ON public.aigas_re_treatment_revisions
 FOR EACH ROW EXECUTE FUNCTION public.aigas_re_reject_history_mutation();
-- Defense in depth: serialize every treatment against the asset and current assessment.
CREATE FUNCTION public.aigas_re_guard_treatment() RETURNS trigger LANGUAGE plpgsql AS $$
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
 IF NEW.status='ACCEPTED' AND latest_assessment.risk_level='HIGH' AND (membership_role<>'OWNER' OR latest_assessment.evaluator_id=NEW.changed_by) THEN
  RAISE EXCEPTION 'High risk acceptance requires an independent owner';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER aigas_re_treatment_guard BEFORE INSERT ON public.aigas_re_treatment_revisions
 FOR EACH ROW EXECUTE FUNCTION public.aigas_re_guard_treatment();
REVOKE ALL ON public.aigas_re_treatment_revisions FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_re_guard_treatment() FROM PUBLIC;
ALTER TABLE public.aigas_re_treatment_revisions ENABLE ROW LEVEL SECURITY;
-- Server guards are mandatory; runtime role/RLS policy approval is separate.
COMMIT;
