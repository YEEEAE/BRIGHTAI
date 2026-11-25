BEGIN;

CREATE TABLE public.aigas_workspace_idempotency (
  actor_id uuid NOT NULL,
  request_key text NOT NULL CHECK (request_key ~ '^[A-Za-z0-9_.:-]{1,128}$'),
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[a-f0-9]{64}$'),
  workspace_id uuid NOT NULL,
  PRIMARY KEY (actor_id, request_key)
);

ALTER TABLE public.aigas_workspace_idempotency ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_idempotency_actor ON public.aigas_workspace_idempotency
  FOR ALL TO aigas_runtime
  USING (actor_id = public.aigas_actor())
  WITH CHECK (actor_id = public.aigas_actor());
REVOKE ALL ON TABLE public.aigas_workspace_idempotency FROM PUBLIC;
GRANT SELECT, INSERT ON TABLE public.aigas_workspace_idempotency TO aigas_runtime;

CREATE TABLE public.aigas_command_idempotency (
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('human-gate.request.create', 'risk-engine.asset.create')),
  request_key text NOT NULL CHECK (request_key ~ '^[A-Za-z0-9_.:-]{1,128}$'),
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[a-f0-9]{64}$'),
  resource_id uuid NOT NULL,
  PRIMARY KEY (tenant_id, actor_id, operation, request_key)
);

ALTER TABLE public.aigas_command_idempotency ENABLE ROW LEVEL SECURITY;
CREATE POLICY command_idempotency_actor ON public.aigas_command_idempotency
  FOR ALL TO aigas_runtime
  USING (actor_id = public.aigas_actor() AND public.aigas_tenant_scope(tenant_id))
  WITH CHECK (actor_id = public.aigas_actor() AND public.aigas_tenant_scope(tenant_id));
REVOKE ALL ON TABLE public.aigas_command_idempotency FROM PUBLIC;
GRANT SELECT, INSERT ON TABLE public.aigas_command_idempotency TO aigas_runtime;

COMMIT;
