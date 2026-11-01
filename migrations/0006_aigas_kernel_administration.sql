-- LOCAL PREPARATION ONLY. Requires 0001 and Neon Managed Auth.
-- Apply only on an explicitly approved development branch; no seed data.
BEGIN;
ALTER TABLE public.aigas_product_access ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version > 0);
-- Operator-issued access only. No tenant API may INSERT/UPDATE these approvals.
-- Each approval is an explicitly referenced, temporary, non-billed administrative decision.
CREATE TABLE public.aigas_product_grants (
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  product_slug text NOT NULL CHECK (product_slug IN ('firewall','ledger','human-gate','risk-engine','secure-chat')),
  approval_reference text NOT NULL CHECK (char_length(btrim(approval_reference)) BETWEEN 2 AND 120),
  access_kind text NOT NULL DEFAULT 'ADMIN_NON_BILLED' CHECK (access_kind = 'ADMIN_NON_BILLED'),
  approved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  PRIMARY KEY (tenant_id, product_slug),
  CHECK (expires_at > approved_at AND expires_at <= approved_at + interval '90 days')
);
CREATE TABLE public.aigas_auth_organizations (
  tenant_id uuid PRIMARY KEY REFERENCES public.aigas_tenants(id),
  organization_id uuid NOT NULL UNIQUE REFERENCES neon_auth.organization(id),
  linked_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.aigas_member_invitations (
  invitation_id uuid PRIMARY KEY REFERENCES neon_auth.invitation(id),
  tenant_id uuid NOT NULL REFERENCES public.aigas_auth_organizations(tenant_id),
  invited_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  role text NOT NULL DEFAULT 'MEMBER' CHECK (role = 'MEMBER'),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_by uuid REFERENCES neon_auth."user"(id),
  accepted_at timestamptz,
  CHECK ((accepted_by IS NULL) = (accepted_at IS NULL))
);
CREATE INDEX aigas_member_invitations_tenant_idx ON public.aigas_member_invitations(tenant_id, created_at DESC);
REVOKE ALL ON public.aigas_product_grants, public.aigas_auth_organizations, public.aigas_member_invitations FROM PUBLIC;
ALTER TABLE public.aigas_product_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_auth_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_member_invitations ENABLE ROW LEVEL SECURITY;
-- Runtime role needs SELECT ONLY on grants; review grants/RLS for the selected role.
-- Approval provisioning is an operator action, never startup code or tenant self-service.
COMMIT;
