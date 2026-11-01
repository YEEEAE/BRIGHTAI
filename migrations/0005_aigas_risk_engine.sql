-- REVIEW ONLY: requires Kernel 0001. No dependency on Firewall, Human Gate or Ledger.
-- First apply to an approved isolated development target, never auto-run on startup.
BEGIN;
CREATE TABLE public.aigas_re_assets (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
 name text NOT NULL CHECK(char_length(btrim(name)) BETWEEN 2 AND 120),
 owner text NOT NULL CHECK(char_length(btrim(owner)) BETWEEN 2 AND 120),
 purpose text NOT NULL CHECK(char_length(btrim(purpose)) BETWEEN 2 AND 500),
 data_classification text NOT NULL CHECK(data_classification IN ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED')),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_by uuid NOT NULL REFERENCES neon_auth."user"(id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(tenant_id,id)
);
CREATE INDEX aigas_re_assets_tenant_idx ON public.aigas_re_assets(tenant_id,created_at DESC,id DESC);
-- Immutable snapshots make the asset's own change history reviewable, not only its assessment snapshots.
CREATE TABLE public.aigas_re_asset_revisions (
 tenant_id uuid NOT NULL,
 asset_id uuid NOT NULL,
 asset_version integer NOT NULL CHECK(asset_version>0),
 asset_snapshot jsonb NOT NULL CHECK(jsonb_typeof(asset_snapshot)='object'),
 changed_by uuid NOT NULL REFERENCES neon_auth."user"(id),
 changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(tenant_id,asset_id,asset_version),
 FOREIGN KEY(tenant_id,asset_id) REFERENCES public.aigas_re_assets(tenant_id,id)
);
CREATE INDEX aigas_re_asset_revisions_history_idx ON public.aigas_re_asset_revisions(tenant_id,asset_id,asset_version DESC);
CREATE TABLE public.aigas_re_assessments (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL,
 asset_id uuid NOT NULL,
 asset_version integer NOT NULL CHECK(asset_version>0),
 asset_snapshot jsonb NOT NULL CHECK(jsonb_typeof(asset_snapshot)='object'),
 likelihood smallint NOT NULL CHECK(likelihood BETWEEN 1 AND 3),
 impact smallint NOT NULL CHECK(impact BETWEEN 1 AND 3),
 likelihood_reason text NOT NULL CHECK(char_length(btrim(likelihood_reason)) BETWEEN 2 AND 500),
 impact_reason text NOT NULL CHECK(char_length(btrim(impact_reason)) BETWEEN 2 AND 500),
 controls_reason text NOT NULL CHECK(char_length(btrim(controls_reason)) BETWEEN 2 AND 500),
 risk_level text NOT NULL CHECK(risk_level IN ('LOW','MEDIUM','HIGH')),
 method_version text NOT NULL CHECK(method_version='draft-likelihood-impact-v1'),
 explanation text NOT NULL,
 suggested_control text NOT NULL,
 evaluator_id uuid NOT NULL REFERENCES neon_auth."user"(id),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(tenant_id,asset_id) REFERENCES public.aigas_re_assets(tenant_id,id),
 CHECK(risk_level=CASE WHEN likelihood*impact<=2 THEN 'LOW' WHEN likelihood*impact<=4 THEN 'MEDIUM' ELSE 'HIGH' END)
);
CREATE INDEX aigas_re_assessments_history_idx ON public.aigas_re_assessments(tenant_id,asset_id,created_at DESC,id DESC);
CREATE FUNCTION public.aigas_re_reject_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Risk history rows are append-only'; END;
$$;
CREATE TRIGGER aigas_re_assessments_append_only BEFORE UPDATE OR DELETE ON public.aigas_re_assessments FOR EACH ROW EXECUTE FUNCTION public.aigas_re_reject_history_mutation();
CREATE TRIGGER aigas_re_asset_revisions_append_only BEFORE UPDATE OR DELETE ON public.aigas_re_asset_revisions FOR EACH ROW EXECUTE FUNCTION public.aigas_re_reject_history_mutation();
REVOKE ALL ON public.aigas_re_assets,public.aigas_re_asset_revisions,public.aigas_re_assessments FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_re_reject_history_mutation() FROM PUBLIC;
ALTER TABLE public.aigas_re_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_re_asset_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_re_assessments ENABLE ROW LEVEL SECURITY;
-- Like Kernel, no browser/Data API grants or permissive RLS policies.
-- Runtime role review is required; server membership checks remain mandatory.
COMMIT;
