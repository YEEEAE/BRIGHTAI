-- REVIEW ONLY: not applied. Requires Kernel 0001. Approve an isolated DB target first.
BEGIN;
CREATE TABLE public.aigas_fw_rules (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
 template text NOT NULL CHECK (template IN ('public','identifier','prohibited')),
 name text NOT NULL,
 match_type text NOT NULL CHECK (match_type='CONTAINS'),
 pattern text NOT NULL CHECK (char_length(pattern) BETWEEN 1 AND 80),
 action text NOT NULL CHECK (action IN ('ALLOW','BLOCK','REDACT')),
 enabled boolean NOT NULL DEFAULT true,
 version integer NOT NULL DEFAULT 1 CHECK (version>0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (tenant_id,template), UNIQUE (tenant_id,id)
);
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
REVOKE ALL ON public.aigas_fw_rules,public.aigas_fw_decisions FROM PUBLIC;
ALTER TABLE public.aigas_fw_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_fw_decisions ENABLE ROW LEVEL SECURITY;
-- No browser/Data API grants or public policies. Use server runtime role after review.
COMMIT;
