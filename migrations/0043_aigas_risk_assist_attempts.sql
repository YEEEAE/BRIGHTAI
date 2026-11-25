BEGIN;

CREATE TABLE public.aigas_risk_assist_attempts (
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  request_key text NOT NULL CHECK (request_key ~ '^[A-Za-z0-9_.:-]{1,128}$'),
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, actor_id, request_key)
);

ALTER TABLE public.aigas_risk_assist_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY risk_assist_attempt_actor ON public.aigas_risk_assist_attempts
  FOR ALL TO aigas_runtime
  USING (actor_id = public.aigas_actor() AND public.aigas_tenant_scope(tenant_id))
  WITH CHECK (actor_id = public.aigas_actor() AND public.aigas_tenant_scope(tenant_id));
REVOKE ALL ON TABLE public.aigas_risk_assist_attempts FROM PUBLIC;
GRANT SELECT, INSERT ON TABLE public.aigas_risk_assist_attempts TO aigas_runtime;

COMMIT;
