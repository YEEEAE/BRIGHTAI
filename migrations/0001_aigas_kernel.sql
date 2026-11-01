-- REVIEW ONLY. Apply manually to an approved isolated development branch first.
-- Requires Neon Managed Auth's neon_auth."user" table; no production auto-migration.
BEGIN;
CREATE TABLE public.aigas_tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.aigas_memberships (
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  role text NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, user_id)
);
CREATE INDEX aigas_memberships_user_idx ON public.aigas_memberships(user_id);
CREATE TABLE public.aigas_product_access (
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  product_slug text NOT NULL CHECK (product_slug IN ('firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat')),
  status text NOT NULL DEFAULT 'FOUNDATION' CHECK (status IN ('FOUNDATION', 'DISABLED', 'ENABLED')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, product_slug)
);
CREATE TABLE public.aigas_audit_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX aigas_audit_tenant_time_idx ON public.aigas_audit_events(tenant_id, created_at);
-- No browser/Data API access. The server checks membership for every operation.
REVOKE ALL ON public.aigas_tenants, public.aigas_memberships, public.aigas_product_access, public.aigas_audit_events FROM PUBLIC;
ALTER TABLE public.aigas_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_product_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_audit_events ENABLE ROW LEVEL SECURITY;
COMMIT;
