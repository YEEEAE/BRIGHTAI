-- Development review only. Depends on 0001 and 0006, not paid products.
-- No seeded approvals, grants, providers, sample data or content retention.
BEGIN;
CREATE TABLE public.aigas_sc_requests (
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  id uuid NOT NULL,
  model_ref text NOT NULL CHECK (length(model_ref) BETWEEN 1 AND 120),
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  state text NOT NULL CHECK (state IN ('RESERVED','SUCCEEDED','FAILED','CANCELLED','UNKNOWN')),
  cancel_requested boolean NOT NULL DEFAULT false,
  reserved_tokens bigint NOT NULL CHECK (reserved_tokens > 0),
  input_tokens bigint CHECK (input_tokens >= 0),
  output_tokens bigint CHECK (output_tokens >= 0),
  total_tokens bigint CHECK (total_tokens >= 0),
  PRIMARY KEY (tenant_id, user_id, id),
  FOREIGN KEY (tenant_id,user_id) REFERENCES public.aigas_memberships(tenant_id,user_id),
  CHECK ((input_tokens IS NULL AND output_tokens IS NULL AND total_tokens IS NULL) OR
    (input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND total_tokens IS NOT NULL AND total_tokens = input_tokens + output_tokens AND total_tokens <= reserved_tokens))
);
CREATE INDEX aigas_sc_requests_window ON public.aigas_sc_requests(tenant_id,created_at,user_id);
CREATE TABLE public.aigas_sc_cancellations (
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  request_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,user_id,request_id),
  FOREIGN KEY(tenant_id,user_id) REFERENCES public.aigas_memberships(tenant_id,user_id)
);
REVOKE ALL ON public.aigas_sc_cancellations FROM PUBLIC;
ALTER TABLE public.aigas_sc_cancellations ENABLE ROW LEVEL SECURITY;
CREATE POLICY sc_cancellation_owner ON public.aigas_sc_cancellations USING (
  tenant_id=nullif(current_setting('aigas.sc_tenant_id',true),'')::uuid AND
  user_id=nullif(current_setting('aigas.sc_user_id',true),'')::uuid
) WITH CHECK (
  tenant_id=nullif(current_setting('aigas.sc_tenant_id',true),'')::uuid AND
  user_id=nullif(current_setting('aigas.sc_user_id',true),'')::uuid
);

-- Metadata-only aggregate for atomic tenant quotas under owner-row RLS.
-- Review the function owner/runtime EXECUTE grant separately before activation.
CREATE FUNCTION public.aigas_sc_usage_window(wanted_tenant uuid, wanted_user uuid)
RETURNS TABLE(user_minute bigint,tenant_minute bigint,user_day bigint,tenant_day bigint,token_charge numeric)
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT count(*) FILTER(WHERE user_id=wanted_user AND created_at>now()-interval '1 minute'),
    count(*) FILTER(WHERE created_at>now()-interval '1 minute'),
    count(*) FILTER(WHERE user_id=wanted_user), count(*),
    coalesce(sum(coalesce(total_tokens,reserved_tokens)),0)
  FROM public.aigas_sc_requests
  WHERE tenant_id=wanted_tenant AND created_at>now()-interval '24 hours'
    AND wanted_tenant=nullif(current_setting('aigas.sc_tenant_id',true),'')::uuid
    AND wanted_user=nullif(current_setting('aigas.sc_user_id',true),'')::uuid
    AND EXISTS(SELECT 1 FROM public.aigas_memberships WHERE tenant_id=wanted_tenant AND user_id=wanted_user)
$$;
REVOKE ALL ON FUNCTION public.aigas_sc_usage_window(uuid,uuid) FROM PUBLIC;

-- Prepared content tables only: application deliberately has no read/write
-- route for these until retention, erasure, data protection and opt-in approval.
-- Do not grant access or activate saving merely by applying this migration.
CREATE TABLE public.aigas_sc_conversations (
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  retention_policy_ref text NOT NULL CHECK (length(btrim(retention_policy_ref)) > 0),
  opt_in_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id,user_id,id),
  FOREIGN KEY (tenant_id,user_id) REFERENCES public.aigas_memberships(tenant_id,user_id),
  CHECK (expires_at > created_at)
);
CREATE TABLE public.aigas_sc_messages (
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  model_ref text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 16000),
  PRIMARY KEY (tenant_id,user_id,conversation_id,id),
  FOREIGN KEY (tenant_id,user_id,conversation_id) REFERENCES public.aigas_sc_conversations(tenant_id,user_id,id)
);
REVOKE ALL ON public.aigas_sc_requests, public.aigas_sc_conversations, public.aigas_sc_messages FROM PUBLIC;
ALTER TABLE public.aigas_sc_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_sc_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aigas_sc_messages ENABLE ROW LEVEL SECURITY;
-- Defense in depth for a separately reviewed runtime role; never browser claims.
-- APIs must still constrain every lookup by tenant AND authenticated user.
CREATE POLICY sc_request_owner ON public.aigas_sc_requests USING (
  tenant_id = nullif(current_setting('aigas.sc_tenant_id',true),'')::uuid AND
  user_id = nullif(current_setting('aigas.sc_user_id',true),'')::uuid
) WITH CHECK (
  tenant_id = nullif(current_setting('aigas.sc_tenant_id',true),'')::uuid AND
  user_id = nullif(current_setting('aigas.sc_user_id',true),'')::uuid
);
-- No content policies or runtime grants: content remains inaccessible by default.
COMMIT;
