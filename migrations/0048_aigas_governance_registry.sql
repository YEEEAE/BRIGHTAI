-- P05: tenant-scoped versioned registry. Approval never grants product access.
BEGIN;
CREATE TABLE public.aigas_registry_entries (
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  kind text NOT NULL CHECK (kind IN ('ASSET','MODEL','TOOL','VENDOR','GOVERNING_AGENT','THIRD_PARTY_AGENT','POLICY_PACK')),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  owner_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  mandate text NOT NULL CHECK (length(btrim(mandate)) BETWEEN 3 AND 500),
  product_slug text NOT NULL CHECK (product_slug IN ('kernel','firewall','risk-engine','human-gate','ledger','secure-chat')),
  capabilities jsonb NOT NULL CHECK (jsonb_typeof(capabilities)='array'),
  source_reference text NOT NULL CHECK (length(btrim(source_reference)) BETWEEN 3 AND 255),
  links jsonb NOT NULL CHECK (jsonb_typeof(links)='array'),
  created_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (tenant_id,id,version)
);
CREATE TABLE public.aigas_registry_decisions (
  tenant_id uuid NOT NULL, entry_id uuid NOT NULL, version integer NOT NULL,
  decision text NOT NULL CHECK (decision IN ('APPROVED','REVOKED')),
  actor_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  expires_at timestamptz, reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 3 AND 500),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (tenant_id,entry_id,version) REFERENCES public.aigas_registry_entries(tenant_id,id,version),
  PRIMARY KEY (tenant_id,entry_id,version,decision),
  CHECK ((decision='APPROVED' AND expires_at IS NOT NULL) OR (decision='REVOKED' AND expires_at IS NULL))
);
ALTER TABLE public.aigas_registry_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_registry_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_registry_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_registry_decisions FORCE ROW LEVEL SECURITY;
CREATE POLICY registry_tenant ON public.aigas_registry_entries FOR ALL TO aigas_runtime USING (public.aigas_tenant_scope(tenant_id)) WITH CHECK (public.aigas_tenant_scope(tenant_id));
CREATE POLICY registry_decision_tenant ON public.aigas_registry_decisions FOR ALL TO aigas_runtime USING (public.aigas_tenant_scope(tenant_id)) WITH CHECK (public.aigas_tenant_scope(tenant_id));
CREATE POLICY registry_client_deny ON public.aigas_registry_entries AS RESTRICTIVE FOR ALL TO PUBLIC USING (current_user NOT IN ('authenticated','anonymous','authenticator','aigas_app_login')) WITH CHECK (current_user NOT IN ('authenticated','anonymous','authenticator','aigas_app_login'));
CREATE POLICY registry_decision_client_deny ON public.aigas_registry_decisions AS RESTRICTIVE FOR ALL TO PUBLIC USING (current_user NOT IN ('authenticated','anonymous','authenticator','aigas_app_login')) WITH CHECK (current_user NOT IN ('authenticated','anonymous','authenticator','aigas_app_login'));
REVOKE ALL ON public.aigas_registry_entries, public.aigas_registry_decisions FROM PUBLIC;
GRANT SELECT, INSERT ON public.aigas_registry_entries, public.aigas_registry_decisions TO aigas_runtime;
COMMIT;
