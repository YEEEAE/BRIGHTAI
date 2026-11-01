-- REVIEW ONLY: apply to an approved isolated development database first.
-- Requires 0001 Kernel; independent of Firewall and commercial license activation.
BEGIN;
CREATE TABLE public.aigas_ld_events (
  event_id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  source text NOT NULL CHECK (source = 'ledger.synthetic-lab'),
  event_type text NOT NULL CHECK (event_type IN ('synthetic.test.created','synthetic.review.recorded')),
  policy_version text NOT NULL CHECK (policy_version = 'foundation-v1'),
  metadata_json jsonb NOT NULL CHECK ((
    jsonb_typeof(metadata_json) = 'object' AND octet_length(metadata_json::text) <= 1024
    AND metadata_json ?& ARRAY['synthetic','scenario','outcome','decision_ref']
    AND metadata_json - ARRAY['synthetic','scenario','outcome','decision_ref'] = '{}'::jsonb
    AND metadata_json->'synthetic' = 'true'::jsonb
    AND metadata_json->>'scenario' IN ('integrity-check','access-check')
    AND metadata_json->>'outcome' IN ('RECORDED','REVIEWED')
    AND metadata_json->>'decision_ref' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) IS TRUE),
  created_at timestamptz(3) NOT NULL,
  created_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  integrity_hash text NOT NULL CHECK (integrity_hash ~ '^[0-9a-f]{64}$')
);
CREATE INDEX aigas_ld_tenant_time_idx ON public.aigas_ld_events(tenant_id,created_at DESC,event_id DESC);
CREATE INDEX aigas_ld_tenant_type_time_idx ON public.aigas_ld_events(tenant_id,event_type,created_at DESC,event_id DESC);
REVOKE ALL ON public.aigas_ld_events FROM PUBLIC;
ALTER TABLE public.aigas_ld_events ENABLE ROW LEVEL SECURITY;
-- No browser/Data API grants or policies. Runtime role/grants need owner review.
-- No update/delete endpoint; this is not administrator-proof immutable storage.
COMMIT;
