-- LOCAL PREPARATION ONLY. Apply only to an explicitly approved isolated environment.
-- No seed policies, memberships, grants, or automatic application.
BEGIN;
CREATE TABLE public.aigas_departments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 100),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RETIRED')),
  created_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id,id),
  UNIQUE (tenant_id,name)
);
CREATE TABLE public.aigas_department_memberships (
  tenant_id uuid NOT NULL,
  department_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  created_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,department_id,user_id),
  FOREIGN KEY (tenant_id,department_id) REFERENCES public.aigas_departments(tenant_id,id)
);
CREATE INDEX aigas_department_memberships_actor_idx ON public.aigas_department_memberships(tenant_id,user_id,status);
CREATE TABLE public.aigas_department_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  department_id uuid NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  subject_user_id uuid REFERENCES neon_auth."user"(id),
  action text NOT NULL CHECK (action IN ('CREATED','MEMBER_ADDED','MEMBER_REVOKED')),
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 3 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id,department_id) REFERENCES public.aigas_departments(tenant_id,id)
);
CREATE INDEX aigas_department_events_history_idx ON public.aigas_department_events(tenant_id,department_id,created_at DESC);
CREATE TABLE public.aigas_policy_delegations (
  tenant_id uuid NOT NULL,
  delegate_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('APPROVE')),
  expires_at timestamptz NOT NULL,
  granted_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  grant_reason text NOT NULL CHECK (char_length(btrim(grant_reason)) BETWEEN 3 AND 500),
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,delegate_user_id,action),
  FOREIGN KEY (tenant_id,delegate_user_id) REFERENCES public.aigas_memberships(tenant_id,user_id),
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '90 days')
);
CREATE INDEX aigas_policy_delegations_active_idx ON public.aigas_policy_delegations(tenant_id,delegate_user_id,action,expires_at) WHERE revoked_at IS NULL;

CREATE TABLE public.aigas_policies (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  scope text NOT NULL CHECK (scope IN ('ENTERPRISE','DEPARTMENT','PRODUCT','USER')),
  department_id uuid,
  product_slug text CHECK (product_slug IS NULL OR product_slug IN ('firewall','ledger','human-gate','risk-engine','secure-chat')),
  user_id uuid REFERENCES neon_auth."user"(id),
  policy_family text NOT NULL CHECK (char_length(btrim(policy_family)) BETWEEN 2 AND 80),
  rule_key text NOT NULL CHECK (char_length(btrim(rule_key)) BETWEEN 2 AND 100),
  owner_user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  current_version integer NOT NULL DEFAULT 0 CHECK (current_version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id,id),
  FOREIGN KEY (tenant_id,department_id) REFERENCES public.aigas_departments(tenant_id,id),
  CHECK ((scope='ENTERPRISE' AND department_id IS NULL AND product_slug IS NULL AND user_id IS NULL)
      OR (scope='DEPARTMENT' AND department_id IS NOT NULL AND product_slug IS NULL AND user_id IS NULL)
      OR (scope='PRODUCT' AND department_id IS NULL AND product_slug IS NOT NULL AND user_id IS NULL)
      OR (scope='USER' AND department_id IS NULL AND product_slug IS NULL AND user_id IS NOT NULL))
);
CREATE INDEX aigas_policies_scope_idx ON public.aigas_policies(tenant_id,scope,department_id,product_slug,user_id);
CREATE TABLE public.aigas_policy_versions (
  tenant_id uuid NOT NULL,
  policy_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','RETIRED')),
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(conditions)='object'),
  effect text NOT NULL CHECK (effect IN ('ALLOW','BLOCK','HARD_DENY','REDACT','REQUEST_APPROVAL','WARN')),
  obligations text[] NOT NULL DEFAULT '{}',
  is_mandatory boolean NOT NULL DEFAULT false,
  effective_from timestamptz,
  expires_at timestamptz,
  checksum text NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
  required_approvals smallint NOT NULL DEFAULT 1 CHECK (required_approvals BETWEEN 1 AND 2),
  change_reason text NOT NULL CHECK (char_length(btrim(change_reason)) BETWEEN 3 AND 500),
  created_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  approved_by uuid REFERENCES neon_auth."user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  PRIMARY KEY (tenant_id,policy_id,version),
  FOREIGN KEY (tenant_id,policy_id) REFERENCES public.aigas_policies(tenant_id,id),
  CHECK (expires_at IS NULL OR effective_from IS NULL OR expires_at > effective_from),
  CHECK ((effect='HARD_DENY' AND is_mandatory) OR effect<>'HARD_DENY'),
  CHECK (status<>'PUBLISHED' OR (approved_by IS NOT NULL AND published_at IS NOT NULL))
);
CREATE INDEX aigas_policy_versions_active_idx ON public.aigas_policy_versions(tenant_id,status,effective_from,expires_at);
CREATE TABLE public.aigas_policy_approvals (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  policy_id uuid NOT NULL,
  version integer NOT NULL,
  action text NOT NULL CHECK (action IN ('SUBMITTED','APPROVED','PUBLISHED','RETIRED','WITHDRAWN')),
  actor_user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 3 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id,policy_id,version) REFERENCES public.aigas_policy_versions(tenant_id,policy_id,version)
);
CREATE INDEX aigas_policy_approvals_history_idx ON public.aigas_policy_approvals(tenant_id,policy_id,version,created_at);
CREATE INDEX aigas_policy_approvals_actor_action_idx ON public.aigas_policy_approvals(tenant_id,policy_id,version,action,actor_user_id);
CREATE TABLE public.aigas_kernel_policy_decisions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
  actor_user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  product_slug text NOT NULL CHECK (product_slug IN ('firewall','ledger','human-gate','risk-engine','secure-chat')),
  operation text NOT NULL CHECK (char_length(btrim(operation)) BETWEEN 2 AND 100),
  decision text NOT NULL CHECK (decision IN ('ALLOW','BLOCK')),
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 2 AND 80),
  policy_chain jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(policy_chain)='array'),
  request_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id,request_id)
);
CREATE INDEX aigas_kernel_policy_decisions_tenant_time_idx ON public.aigas_kernel_policy_decisions(tenant_id,created_at DESC);

CREATE FUNCTION public.aigas_policy_version_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN
    IF OLD.status IN ('PUBLISHED','RETIRED') THEN RAISE EXCEPTION 'PUBLISHED_POLICY_VERSION_IMMUTABLE'; END IF;
    RETURN OLD;
  END IF;
  IF OLD.status IN ('PUBLISHED','RETIRED') AND
     (NEW.conditions,NEW.effect,NEW.obligations,NEW.is_mandatory,NEW.effective_from,NEW.expires_at,NEW.checksum,NEW.change_reason,NEW.created_by,NEW.approved_by)
     IS DISTINCT FROM
     (OLD.conditions,OLD.effect,OLD.obligations,OLD.is_mandatory,OLD.effective_from,OLD.expires_at,OLD.checksum,OLD.change_reason,OLD.created_by,OLD.approved_by)
  THEN RAISE EXCEPTION 'PUBLISHED_POLICY_VERSION_IMMUTABLE'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER aigas_policy_version_immutable BEFORE UPDATE OR DELETE ON public.aigas_policy_versions
FOR EACH ROW EXECUTE FUNCTION public.aigas_policy_version_guard();
CREATE FUNCTION public.aigas_policy_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'POLICY_AUDIT_APPEND_ONLY'; END $$;
CREATE TRIGGER aigas_policy_approvals_append_only BEFORE UPDATE OR DELETE ON public.aigas_policy_approvals
FOR EACH ROW EXECUTE FUNCTION public.aigas_policy_append_only();
CREATE TRIGGER aigas_department_events_append_only BEFORE UPDATE OR DELETE ON public.aigas_department_events
FOR EACH ROW EXECUTE FUNCTION public.aigas_policy_append_only();
CREATE TRIGGER aigas_kernel_policy_decisions_append_only BEFORE UPDATE OR DELETE ON public.aigas_kernel_policy_decisions
FOR EACH ROW EXECUTE FUNCTION public.aigas_policy_append_only();

REVOKE ALL ON public.aigas_departments,public.aigas_department_memberships,public.aigas_department_events,public.aigas_policy_delegations,public.aigas_policies,public.aigas_policy_versions,public.aigas_policy_approvals,public.aigas_kernel_policy_decisions FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_policy_version_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_policy_append_only() FROM PUBLIC;
ALTER TABLE public.aigas_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_department_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_department_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_policy_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_policy_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_kernel_policy_decisions ENABLE ROW LEVEL SECURITY;
COMMIT;
