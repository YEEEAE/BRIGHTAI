-- REVIEW ONLY: not applied to Neon. Requires Kernel 0001. Approve an isolated dev branch/target first.
-- Changes in this revision (2026-11-01): editable literal rules, per-tenant unique name,
-- priority ordering, starter-template partial uniqueness, decision filter index.
BEGIN;
CREATE TABLE public.aigas_fw_rules (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
 -- Server-owned starter template key; NULL once a tenant edits pattern/action.
 template text CHECK (template IN ('public','identifier','prohibited')),
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 60 AND name !~ E'[\x01-\x1F\x7F]'),
 match_type text NOT NULL DEFAULT 'CONTAINS' CHECK (match_type='CONTAINS'),
 -- Literal text, never a regular expression. Case-insensitive containment only.
 pattern text NOT NULL CHECK (char_length(pattern) BETWEEN 1 AND 80 AND pattern !~ E'[\x01-\x1F\x7F]'),
 action text NOT NULL CHECK (action IN ('ALLOW','BLOCK','REDACT')),
 priority smallint NOT NULL DEFAULT 100 CHECK (priority BETWEEN 1 AND 999),
 enabled boolean NOT NULL DEFAULT true,
 version integer NOT NULL DEFAULT 1 CHECK (version>0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (tenant_id,id),
 UNIQUE (tenant_id,name)
);
CREATE UNIQUE INDEX aigas_fw_rules_template_idx ON public.aigas_fw_rules(tenant_id,template) WHERE template IS NOT NULL;
CREATE INDEX aigas_fw_rules_tenant_order_idx ON public.aigas_fw_rules(tenant_id,priority,created_at);
CREATE TABLE public.aigas_fw_decisions (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 action text NOT NULL CHECK (action IN ('ALLOW','BLOCK','REDACT')),
 reason text NOT NULL CHECK (reason IN ('NO_ACTIVE_POLICY','INVALID_POLICY','RULE_BLOCK','RULE_REDACT','RULE_ALLOW','NO_MATCH_LAB_ONLY')),
 rule_id uuid,
 rule_version integer CHECK (rule_version>0),
 FOREIGN KEY (tenant_id,rule_id) REFERENCES public.aigas_fw_rules(tenant_id,id),
 CHECK ((rule_id IS NULL)=(rule_version IS NULL))
);
CREATE INDEX aigas_fw_decisions_tenant_time_idx ON public.aigas_fw_decisions(tenant_id,created_at DESC);
CREATE INDEX aigas_fw_decisions_tenant_action_idx ON public.aigas_fw_decisions(tenant_id,action,created_at DESC);
REVOKE ALL ON public.aigas_fw_rules,public.aigas_fw_decisions FROM PUBLIC;
ALTER TABLE public.aigas_fw_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_fw_decisions ENABLE ROW LEVEL SECURITY;
-- No browser/Data API grants or public policies. Tenant scoping is enforced in the server service;
-- review the runtime role and add tenant RLS policies before exposing any non-owner runtime role.
COMMIT;
