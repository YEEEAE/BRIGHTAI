-- Additive Risk Engine metadata and narrative residual-risk fields.
-- Keep existing assets, assessment history and treatment revisions; no approval is inferred.
-- Applied to production on 2026-11-03 at the owner's explicit request; retained here as the migration source.
BEGIN;

ALTER TABLE public.aigas_re_assets
  ADD COLUMN data_context text NOT NULL DEFAULT '' CHECK (char_length(data_context) <= 500),
  ADD COLUMN provider_reference text NOT NULL DEFAULT '' CHECK (char_length(provider_reference) <= 120),
  ADD COLUMN model_reference text NOT NULL DEFAULT '' CHECK (char_length(model_reference) <= 120),
  ADD COLUMN model_version text NOT NULL DEFAULT '' CHECK (char_length(model_version) <= 120),
  ADD COLUMN approval_status text NOT NULL DEFAULT 'غير موثق' CHECK (char_length(approval_status) <= 120),
  ADD COLUMN lifecycle_status text NOT NULL DEFAULT 'ACTIVE' CHECK (lifecycle_status IN ('ACTIVE','RETIRED'));

ALTER TABLE public.aigas_re_treatment_revisions
  ADD COLUMN residual_risk_description text NOT NULL DEFAULT 'غير موثق في النسخة السابقة'
    CHECK (char_length(btrim(residual_risk_description)) BETWEEN 2 AND 500);

COMMIT;
