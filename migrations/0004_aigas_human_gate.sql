-- REVIEW ONLY. Requires 0001 Kernel. Apply to an approved development target first.
BEGIN;
CREATE TABLE public.aigas_hg_requests (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
 requester_id uuid NOT NULL REFERENCES neon_auth."user"(id),
 title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 120),
 description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 2 AND 500),
 reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 2 AND 500),
 operation_scope text NOT NULL CHECK (operation_scope = 'INTERNAL_DEMO_NOTE'),
 policy_version text NOT NULL DEFAULT 'human-gate-foundation-v1' CHECK (policy_version = 'human-gate-foundation-v1'),
 status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 CHECK (completed_at IS NULL OR status='APPROVED'),
 UNIQUE (tenant_id,id,requester_id)
);
CREATE INDEX aigas_hg_requests_tenant_status_idx ON public.aigas_hg_requests(tenant_id,status,created_at DESC,id DESC);
CREATE TABLE public.aigas_hg_decisions (
 id uuid PRIMARY KEY,
 tenant_id uuid NOT NULL,
 request_id uuid NOT NULL UNIQUE,
 requester_id uuid NOT NULL,
 reviewer_id uuid NOT NULL REFERENCES neon_auth."user"(id),
 decision text NOT NULL CHECK (decision IN ('APPROVE','REJECT')),
 reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 2 AND 500),
 decided_at timestamptz NOT NULL DEFAULT now(),
 CHECK (reviewer_id <> requester_id),
 FOREIGN KEY (tenant_id,request_id,requester_id) REFERENCES public.aigas_hg_requests(tenant_id,id,requester_id)
);
REVOKE ALL ON public.aigas_hg_requests,public.aigas_hg_decisions FROM PUBLIC;
ALTER TABLE public.aigas_hg_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_hg_decisions ENABLE ROW LEVEL SECURITY;
COMMIT;
