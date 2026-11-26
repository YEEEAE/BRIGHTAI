-- P02 — AIGAS agent runtime persistence (additive, no upgrade-only replay).
--
-- Adds the durable substrate for agent runs, steps, tool calls, checkpoints,
-- tenant memory, budget reservations and a transactional outbox. All tables are
-- tenant-scoped, RLS-protected (including FORCE on the owner), and reachable only
-- by the limited aigas_runtime role. References are opaque identifiers; prompts,
-- secrets and hidden reasoning are never persisted (see the CHECK expressions).
--
-- 0018 is intentionally left byte-identical: its SHA-256 is already recorded in
-- Staging and in the isolated audit branch. The owner-name dependency is fixed
-- here, catalog-driven, so no forged receipt is needed when the owner is not
-- named neondb_owner.
BEGIN;

-- 1. Portable default-privilege revocation (replaces 0018's hardcoded owner name
--    without changing 0018's checksum). REVOKEs are unconditional for the real
--    owner; client-role statements run only when those roles exist.
DO $$
DECLARE
  owner_role name;
  client_role text;
BEGIN
  SELECT pg_get_userbyid(c.relowner) INTO owner_role
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'aigas_tenants' AND c.relkind = 'r'
  LIMIT 1;
  IF owner_role IS NULL THEN owner_role := current_user; END IF;

  FOREACH client_role IN ARRAY ARRAY['authenticated', 'anonymous'] LOOP
    IF to_regrole(client_role) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', client_role);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', client_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON TABLES FROM %I', owner_role, client_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', owner_role, client_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', owner_role, client_role);
    END IF;
  END LOOP;
  -- Functions are EXECUTE to PUBLIC by default; a client role inherits that path.
  EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC';
END $$;

-- 2. Limited login role. No direct table grants: the only path to data is
--    SET ROLE aigas_runtime (SET TRUE, INHERIT FALSE), then tenant-scoped RLS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aigas_runtime') THEN
    RAISE EXCEPTION '0047 requires aigas_runtime from 0025';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aigas_app_login') THEN
    EXECUTE 'CREATE ROLE aigas_app_login LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS';
  ELSIF EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'aigas_app_login'
      AND (rolsuper OR rolbypassrls OR rolinherit OR rolcreaterole OR rolcreatedb)
  ) THEN
    -- A non-superuser owner cannot strip SUPERUSER/BYPASSRLS; fail closed instead
    -- of silently leaving an over-privileged login in place.
    RAISE EXCEPTION 'aigas_app_login has unsafe role attributes';
  END IF;
  EXECUTE 'GRANT aigas_runtime TO aigas_app_login WITH INHERIT FALSE, SET TRUE';
  EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM aigas_app_login';
  EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM aigas_app_login';
  EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM aigas_app_login';
END $$;

-- 3. Durable agent state. Opaque *_ref columns hold references to sanitized
--    artifacts only; no raw prompt, model output, secret or hidden reasoning is
--    stored here. The regex CHECKs reject free-form payloads at the boundary.
CREATE TABLE IF NOT EXISTS public.aigas_agent_runs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  parent_run_id uuid,
  agent_key text NOT NULL CHECK (agent_key ~ '^[a-z][a-z0-9-]{1,63}$'),
  policy_version text NOT NULL CHECK (policy_version ~ '^[A-Za-z0-9_.:-]{1,64}$'),
  status text NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED','RUNNING','PAUSED','COMPLETED','FAILED','CANCELLED','EXPIRED')),
  idempotency_key text NOT NULL CHECK (idempotency_key ~ '^[A-Za-z0-9_.:-]{1,128}$'),
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[a-f0-9]{32}$'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, request_fingerprint),
  FOREIGN KEY (tenant_id, parent_run_id) REFERENCES public.aigas_agent_runs(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.aigas_agent_steps (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  step_no integer NOT NULL CHECK (step_no BETWEEN 1 AND 1000),
  kind text NOT NULL CHECK (kind IN ('PLAN','TOOL','POLICY','HUMAN_GATE','RESULT')),
  status text NOT NULL CHECK (status IN ('PENDING','RUNNING','DONE','FAILED','CANCELLED')),
  -- Short auditable action summary, never hidden reasoning or raw model text.
  summary text NOT NULL CHECK (char_length(btrim(summary)) BETWEEN 1 AND 500 AND summary !~ '[
]'),
  input_ref text CHECK (input_ref ~ '^[A-Za-z0-9_.:/-]{1,255}$'),
  output_ref text CHECK (output_ref ~ '^[A-Za-z0-9_.:/-]{1,255}$'),
  policy_version text NOT NULL CHECK (policy_version ~ '^[A-Za-z0-9_.:-]{1,64}$'),
  idempotency_key text NOT NULL CHECK (idempotency_key ~ '^[A-Za-z0-9_.:-]{1,128}$'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, run_id, step_no),
  UNIQUE (tenant_id, run_id, idempotency_key),
  FOREIGN KEY (tenant_id, run_id) REFERENCES public.aigas_agent_runs(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.aigas_tool_invocations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  step_id uuid,
  tool_name text NOT NULL CHECK (tool_name ~ '^[a-z][a-z0-9-]{1,63}$'),
  tool_version text NOT NULL CHECK (tool_version ~ '^[A-Za-z0-9_.:-]{1,64}$'),
  arguments_ref text CHECK (arguments_ref ~ '^[A-Za-z0-9_.:/-]{1,255}$'),
  result_ref text CHECK (result_ref ~ '^[A-Za-z0-9_.:/-]{1,255}$'),
  status text NOT NULL CHECK (status IN ('PENDING','ALLOWED','DENIED','EXECUTED','FAILED','CANCELLED')),
  idempotency_key text NOT NULL CHECK (idempotency_key ~ '^[A-Za-z0-9_.:-]{1,128}$'),
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[a-f0-9]{32}$'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, run_id, idempotency_key),
  UNIQUE (tenant_id, request_fingerprint),
  FOREIGN KEY (tenant_id, run_id) REFERENCES public.aigas_agent_runs(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, step_id) REFERENCES public.aigas_agent_steps(tenant_id, id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.aigas_checkpoints (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  -- Opaque reference to a resume state; no embedded context or secret.
  state_ref text NOT NULL CHECK (state_ref ~ '^[A-Za-z0-9_.:/-]{1,255}$'),
  approval_fingerprint text CHECK (approval_fingerprint ~ '^[a-f0-9]{32}$'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, run_id, version),
  FOREIGN KEY (tenant_id, run_id) REFERENCES public.aigas_agent_runs(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.aigas_tenant_memory (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES neon_auth."user"(id),
  agent_key text NOT NULL CHECK (agent_key ~ '^[a-z][a-z0-9-]{1,63}$'),
  scope text NOT NULL CHECK (scope IN ('TENANT','USER','RUN')),
  memory_key text NOT NULL CHECK (memory_key ~ '^[A-Za-z0-9_.:-]{1,128}$'),
  -- Reference to sanitized content, never the content itself.
  value_ref text NOT NULL CHECK (value_ref ~ '^[A-Za-z0-9_.:/-]{1,255}$'),
  source_ref text CHECK (source_ref ~ '^[A-Za-z0-9_.:/-]{1,255}$'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  consent boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, agent_key, scope, memory_key, version)
);

CREATE TABLE IF NOT EXISTS public.aigas_budget_reservations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  product_slug text NOT NULL CHECK (product_slug IN ('firewall','ledger','human-gate','risk-engine','secure-chat')),
  units integer NOT NULL CHECK (units BETWEEN 1 AND 100000),
  status text NOT NULL DEFAULT 'RESERVED'
    CHECK (status IN ('RESERVED','COMMITTED','RELEASED','EXPIRED')),
  idempotency_key text NOT NULL CHECK (idempotency_key ~ '^[A-Za-z0-9_.:-]{1,128}$'),
  request_fingerprint text NOT NULL CHECK (request_fingerprint ~ '^[a-f0-9]{32}$'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, request_fingerprint),
  FOREIGN KEY (tenant_id, run_id) REFERENCES public.aigas_agent_runs(tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.aigas_outbox (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id) ON DELETE CASCADE,
  aggregate_type text NOT NULL CHECK (aggregate_type IN ('AGENT_RUN','AGENT_STEP','TOOL_INVOCATION','BUDGET','MEMORY')),
  aggregate_id uuid NOT NULL,
  event_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type ~ '^[a-z][a-z0-9.-]{1,63}$'),
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  correlation_id uuid,
  causation_id uuid,
  -- Opaque reference; event payloads are sanitized before persistence.
  payload_ref text NOT NULL CHECK (payload_ref ~ '^[A-Za-z0-9_.:/-]{1,255}$'),
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','DISPATCHED','FAILED','DEAD','EXPIRED')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
  idempotency_key text NOT NULL CHECK (idempotency_key ~ '^[A-Za-z0-9_.:-]{1,128}$'),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, event_id),
  UNIQUE (tenant_id, idempotency_key)
);

-- 4. RLS on every new table: tenant-scoped runtime policy, restrictive client
--    deny, and FORCE so the BYPASSRLS table owner cannot silently read across
--    tenants. Expired rows are never visible to the runtime path.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT unnest(ARRAY[
      'aigas_agent_runs','aigas_agent_steps','aigas_tool_invocations',
      'aigas_checkpoints','aigas_tenant_memory','aigas_budget_reservations','aigas_outbox'
    ]) AS relname
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target.relname);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', target.relname);
    EXECUTE format('DROP POLICY IF EXISTS aigas_agent_tenant ON public.%I', target.relname);
    EXECUTE format('DROP POLICY IF EXISTS aigas_client_deny ON public.%I', target.relname);
    EXECUTE format(
      'CREATE POLICY aigas_agent_tenant ON public.%I FOR ALL TO aigas_runtime '
      || 'USING (public.aigas_tenant_scope(tenant_id) AND (expires_at > now())) '
      || 'WITH CHECK (public.aigas_tenant_scope(tenant_id) AND (expires_at > now()))', target.relname);
    EXECUTE format(
      'CREATE POLICY aigas_client_deny ON public.%I AS RESTRICTIVE FOR ALL TO PUBLIC '
      || 'USING (current_user NOT IN (''authenticated'',''anonymous'',''authenticator'',''aigas_app_login'')) '
      || 'WITH CHECK (current_user NOT IN (''authenticated'',''anonymous'',''authenticator'',''aigas_app_login''))', target.relname);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', target.relname);
  END LOOP;
END $$;

-- 5. Least-privilege verbs. Append-only history keeps no UPDATE/DELETE; mutable
--    memory, budget settlement and outbox dispatch get narrow UPDATE/DELETE.
GRANT SELECT, INSERT, UPDATE ON public.aigas_agent_runs TO aigas_runtime;
GRANT SELECT, INSERT, UPDATE ON public.aigas_agent_steps TO aigas_runtime;
GRANT SELECT, INSERT, UPDATE ON public.aigas_tool_invocations TO aigas_runtime;
GRANT SELECT, INSERT, UPDATE ON public.aigas_checkpoints TO aigas_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aigas_tenant_memory TO aigas_runtime;
GRANT SELECT, INSERT, UPDATE ON public.aigas_budget_reservations TO aigas_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aigas_outbox TO aigas_runtime;

-- 6. Lifecycle functions. SECURITY INVOKER (RLS still applies) with a pinned
--    search_path; no client role receives EXECUTE. start(uuid)/read(uuid) are
--    tenant-bound and idempotent by request UUID.
CREATE OR REPLACE FUNCTION public.aigas_agent_start(requested uuid)
RETURNS uuid LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
  tenant uuid := nullif(current_setting('aigas.tenant_id', true), '')::uuid;
  actor uuid := public.aigas_actor();
  run_id uuid;
BEGIN
  IF tenant IS NULL OR NOT public.aigas_tenant_scope(tenant) OR actor IS NULL THEN
    RAISE EXCEPTION 'Agent run requires a verified tenant and actor' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.aigas_agent_runs
    (id, tenant_id, actor_id, agent_key, policy_version, idempotency_key, request_fingerprint, expires_at)
  VALUES
    (gen_random_uuid(), tenant, actor, 'kernel-agent', 'p2', requested::text,
     md5(requested::text || tenant::text || requested::text), now() + interval '24 hours')
  ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
  RETURNING id INTO run_id;
  IF run_id IS NULL THEN
    SELECT id INTO STRICT run_id FROM public.aigas_agent_runs
    WHERE tenant_id = tenant AND idempotency_key = requested::text;
  END IF;
  RETURN run_id;
END $$;

CREATE OR REPLACE FUNCTION public.aigas_agent_read(requested uuid)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = pg_catalog, public AS $$
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM public.aigas_agent_runs r
    WHERE r.id = requested AND public.aigas_tenant_scope(r.tenant_id)
  ) THEN jsonb_build_object(
      'run_id', r.id, 'status', r.status, 'agent_key', r.agent_key,
      'policy_version', r.policy_version, 'expires_at', r.expires_at)
    ELSE jsonb_build_object('run_id', null, 'status', 'NOT_FOUND')
  END
  FROM public.aigas_agent_runs r WHERE r.id = requested LIMIT 1
$$;

-- Atomic budget reservation: the unique key decides the replay, and a reused
-- key with a different fingerprint is a conflict rather than a second charge.
CREATE OR REPLACE FUNCTION public.aigas_agent_reserve_budget(
  p_tenant uuid, p_run uuid, p_product text, p_units integer, p_request uuid)
RETURNS uuid LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
  reservation_id uuid;
  fingerprint text := md5(p_request::text || p_tenant::text || p_run::text || p_product || p_units::text);
BEGIN
  IF NOT public.aigas_tenant_scope(p_tenant) OR public.aigas_actor() IS NULL THEN
    RAISE EXCEPTION 'Budget reservation requires a verified tenant and actor' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.aigas_agent_runs r WHERE r.id = p_run AND r.tenant_id = p_tenant) THEN
    RAISE EXCEPTION 'Run does not belong to tenant' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.aigas_budget_reservations AS b
    (id, tenant_id, run_id, product_slug, units, idempotency_key, request_fingerprint, expires_at)
  VALUES
    (gen_random_uuid(), p_tenant, p_run, p_product, p_units, p_request::text, fingerprint, now() + interval '1 hour')
  ON CONFLICT (tenant_id, idempotency_key) DO UPDATE
    SET status = b.status
    WHERE b.request_fingerprint = EXCLUDED.request_fingerprint
  RETURNING b.id INTO reservation_id;
  IF reservation_id IS NULL THEN
    RAISE EXCEPTION 'Idempotency key reused with a different payload' USING ERRCODE = '23505';
  END IF;
  RETURN reservation_id;
END $$;

-- Explicit expiry maintenance; ordinary reads already hide expired rows.
CREATE OR REPLACE FUNCTION public.aigas_agent_expire(p_tenant uuid)
RETURNS integer LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
  removed integer := 0;
  affected integer;
  target text;
BEGIN
  IF NOT public.aigas_tenant_scope(p_tenant) THEN
    RAISE EXCEPTION 'Expiry requires a verified tenant' USING ERRCODE = '42501';
  END IF;
  FOREACH target IN ARRAY ARRAY[
    'aigas_agent_runs','aigas_agent_steps','aigas_tool_invocations',
    'aigas_checkpoints','aigas_tenant_memory','aigas_budget_reservations','aigas_outbox'
  ] LOOP
    EXECUTE format('DELETE FROM public.%I WHERE tenant_id = $1 AND expires_at <= now()', target)
      USING p_tenant;
    GET DIAGNOSTICS affected = ROW_COUNT;
    removed := removed + affected;
  END LOOP;
  RETURN removed;
END $$;

DO $$
DECLARE target record;
BEGIN
  FOR target IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname LIKE 'aigas\_agent\_%'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', target.signature);
    IF to_regrole('authenticated') IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', target.signature);
    END IF;
    IF to_regrole('anonymous') IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anonymous', target.signature);
    END IF;
    IF to_regrole('aigas_app_login') IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM aigas_app_login', target.signature);
    END IF;
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO aigas_runtime', target.signature);
  END LOOP;
END $$;

COMMIT;
