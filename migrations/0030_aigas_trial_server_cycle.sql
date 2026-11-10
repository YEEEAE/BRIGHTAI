-- LOCAL DRAFT ONLY — NOT APPLIED.
--
-- P06-A: server-side trial cycle closure. This migration adds what `0023` left
-- open, without changing `0023` itself (it is already applied on the isolated
-- staging branch and its ledger hash is evidence):
--
--   1. A named operator channel (`aigas_trial_operators`) that is provisioned by
--      the database owner, never self-granted and never derived from a JWT claim.
--   2. A release/environment readiness register (`aigas_release_readiness`) that
--      gates activation on a fresh PASS for the exact product, release SHA and
--      environment. No row exists in any real environment, so activation stays
--      closed until P07–P11 produce product evidence.
--   3. An approval-gated quota profile (`aigas_trial_quota_limits`) plus usage and
--      idempotent reservations. No commercial number is created here: a missing
--      approved limit is a denial (`QUOTA_NOT_APPROVED`), never "unlimited".
--   4. Per-verb RLS on the three `0023` tables. The generic `0025` policy allowed
--      any tenant-scoped write on requests/events; `0023` itself says a tenant may
--      never write a trial decision. This file replaces that policy with
--      tenant=read/request-create and operator=decision-only, and revokes forged
--      `actor_source='OPERATOR'` events from tenant scope.
--   5. A database activation guard: an UPDATE to ACTIVATED is refused unless the
--      session carries a verified environment + release SHA and every requested
--      product has a fresh PASS readiness row and an approved quota profile.
--
-- It creates no trial, no operator, no readiness row, no quota value and no user.
-- Retention/export/deletion execution stays out of scope (P20).

BEGIN;

-- 1. Named operator channel. Provisioning is an owner action with an approval
--    reference; the runtime role can only read its own row.
CREATE TABLE public.aigas_trial_operators (
  user_id uuid PRIMARY KEY REFERENCES neon_auth."user"(id),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  approval_reference text NOT NULL CHECK (char_length(btrim(approval_reference)) BETWEEN 4 AND 200),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CHECK (status <> 'REVOKED' OR revoked_at IS NOT NULL),
  CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

-- 2. Readiness register. One row per product/release/environment. `expires_at`
--    makes "recent result for the same build and environment" enforceable.
CREATE TABLE public.aigas_release_readiness (
  environment text NOT NULL CHECK (environment IN ('local', 'staging', 'production')),
  release_sha text NOT NULL CHECK (release_sha ~ '^[0-9a-f]{7,40}$'),
  product_slug text NOT NULL CHECK (product_slug IN ('firewall','ledger','human-gate','risk-engine','secure-chat')),
  status text NOT NULL CHECK (status IN ('PASS', 'FAIL')),
  verified_at timestamptz NOT NULL,
  verified_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  evidence_reference text NOT NULL CHECK (char_length(btrim(evidence_reference)) BETWEEN 4 AND 200),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (environment, release_sha, product_slug),
  CHECK (expires_at > verified_at)
);
CREATE INDEX aigas_release_readiness_product_idx
  ON public.aigas_release_readiness(product_slug, environment, expires_at DESC);

-- 3. Approval-gated quota profile. Values are not invented by this migration;
--    `approved_by` and `approval_reference` are mandatory so an unapproved or
--    anonymous number cannot become a limit. Absence of a row denies metering.
CREATE TABLE public.aigas_trial_quota_limits (
  product_slug text PRIMARY KEY CHECK (product_slug IN ('firewall','ledger','human-gate','risk-engine','secure-chat')),
  unit text NOT NULL DEFAULT 'OPERATION' CHECK (unit = 'OPERATION'),
  limit_units bigint NOT NULL CHECK (limit_units > 0),
  approval_reference text NOT NULL CHECK (char_length(btrim(approval_reference)) BETWEEN 4 AND 200),
  approved_by uuid NOT NULL REFERENCES neon_auth."user"(id),
  approved_at timestamptz NOT NULL DEFAULT now(),
  effective_from timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  CHECK (expires_at IS NULL OR expires_at > effective_from)
);

CREATE TABLE public.aigas_trial_quota_usage (
  trial_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  product_slug text NOT NULL CHECK (product_slug IN ('firewall','ledger','human-gate','risk-engine','secure-chat')),
  units bigint NOT NULL DEFAULT 0 CHECK (units >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trial_id, product_slug),
  FOREIGN KEY (trial_id, tenant_id) REFERENCES public.aigas_trial_requests(id, tenant_id)
);

CREATE TABLE public.aigas_trial_quota_reservations (
  trial_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  product_slug text NOT NULL CHECK (product_slug IN ('firewall','ledger','human-gate','risk-engine','secure-chat')),
  idempotency_key text NOT NULL CHECK (char_length(btrim(idempotency_key)) BETWEEN 8 AND 120),
  units bigint NOT NULL CHECK (units > 0),
  allowed boolean NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 2 AND 40),
  used_after bigint NOT NULL CHECK (used_after >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trial_id, product_slug, idempotency_key),
  FOREIGN KEY (trial_id, tenant_id) REFERENCES public.aigas_trial_requests(id, tenant_id)
);

-- 4. Operator predicate. SECURITY DEFINER so tenant tables never need to expose
--    the operator roster; it returns a boolean only, for the current actor GUC.
CREATE OR REPLACE FUNCTION public.aigas_trial_operator_active()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.aigas_trial_operators o
    WHERE o.user_id = public.aigas_actor() AND o.status = 'ACTIVE'
  )
$$;

-- 4b. Tenant transition function. A tenant has no UPDATE policy on trial
--     requests, so request/review/cancel go through this SECURITY DEFINER
--     function. It accepts only tenant-owned transitions and never a decision,
--     an approval or an activation: those columns are not writable here.
CREATE OR REPLACE FUNCTION public.aigas_trial_tenant_transition(
  p_trial uuid, p_tenant uuid, p_to text, p_reason text DEFAULT NULL
) RETURNS TABLE(from_state text, state text, version integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_row record;
BEGIN
  IF NOT public.aigas_tenant_scope(p_tenant) OR NOT public.aigas_actor_is_manager(p_tenant) THEN
    RAISE EXCEPTION 'Tenant scope and manager role required' USING ERRCODE = '42501';
  END IF;
  SELECT r.state INTO v_row
    FROM public.aigas_trial_requests r
    WHERE r.id = p_trial AND r.tenant_id = p_tenant
    FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  IF NOT (
    (v_row.state = 'REQUESTED' AND p_to = 'ELIGIBILITY_REVIEW')
    OR (v_row.state IN ('REQUESTED','ELIGIBILITY_REVIEW','APPROVED','ACTIVATED') AND p_to = 'CANCELLED')
  ) THEN
    RAISE EXCEPTION 'Tenant trial transition % -> % is not allowed', v_row.state, p_to USING ERRCODE = 'P0001';
  END IF;
  IF p_to = 'CANCELLED' AND (p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 10 AND 1000) THEN
    RAISE EXCEPTION 'Cancellation reason is required' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
    UPDATE public.aigas_trial_requests r
      SET state = p_to, reason = COALESCE(p_reason, r.reason), version = r.version + 1
      WHERE r.id = p_trial AND r.tenant_id = p_tenant AND r.state = v_row.state
      RETURNING v_row.state, r.state, r.version;
END;
$$;


--    cannot count twice or skip the window/entitlement checks. SECURITY DEFINER
--    because runtime must not hold verbs on the quota tables; tenant scope is
--    still required, so the caller cannot consume for another tenant.
-- 5. Quota consumption. One function owns the whole decision so a product route
--    cannot count twice or skip the window/entitlement checks. SECURITY DEFINER
--    because runtime must not hold verbs on the quota tables; tenant scope is
--    still required, so the caller cannot consume for another tenant.
CREATE OR REPLACE FUNCTION public.aigas_trial_consume_quota(
  p_trial uuid, p_tenant uuid, p_product text, p_units bigint, p_key text
) RETURNS TABLE(allowed boolean, reason text, used bigint, limit_units bigint, remaining bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_state text;
  v_activated timestamptz;
  v_expires timestamptz;
  v_limit bigint;
  v_used bigint;
  v_allowed boolean;
  v_reason text;
  v_previous record;
BEGIN
  IF p_units IS NULL OR p_units < 1 OR p_units > 1000000 THEN
    RAISE EXCEPTION 'Invalid quota units' USING ERRCODE = '22023';
  END IF;
  IF p_key IS NULL OR char_length(btrim(p_key)) NOT BETWEEN 8 AND 120 THEN
    RAISE EXCEPTION 'Invalid quota idempotency key' USING ERRCODE = '22023';
  END IF;
  IF NOT public.aigas_tenant_scope(p_tenant) THEN
    RAISE EXCEPTION 'Tenant scope required' USING ERRCODE = '42501';
  END IF;

  SELECT r.state, r.activated_at, r.expires_at
    INTO v_state, v_activated, v_expires
    FROM public.aigas_trial_requests r
    WHERE r.id = p_trial AND r.tenant_id = p_tenant
    FOR SHARE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'TRIAL_NOT_FOUND', 0::bigint, 0::bigint, 0::bigint;
    RETURN;
  END IF;

  -- Fail closed: an absent or expired approval is a denial, not a large limit.
  SELECT q.limit_units INTO v_limit
    FROM public.aigas_trial_quota_limits q
    WHERE q.product_slug = p_product
      AND q.effective_from <= clock_timestamp()
      AND (q.expires_at IS NULL OR q.expires_at > clock_timestamp());
  IF v_limit IS NULL THEN
    RETURN QUERY SELECT false, 'QUOTA_NOT_APPROVED', 0::bigint, NULL::bigint, NULL::bigint;
    RETURN;
  END IF;

  IF v_state <> 'ACTIVATED' THEN
    RETURN QUERY SELECT false, 'TRIAL_NOT_ACTIVE', 0::bigint, v_limit, 0::bigint;
    RETURN;
  END IF;
  IF v_expires IS NULL OR clock_timestamp() >= v_expires THEN
    RETURN QUERY SELECT false, 'TRIAL_WINDOW_ENDED', 0::bigint, v_limit, 0::bigint;
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.aigas_trial_entitlements e
    WHERE e.trial_id = p_trial AND e.tenant_id = p_tenant AND e.product_slug = p_product
      AND e.status = 'ACTIVE'
      AND e.starts_at = v_activated AND e.ends_at = v_expires
  ) THEN
    RETURN QUERY SELECT false, 'ENTITLEMENT_NOT_ACTIVE', 0::bigint, v_limit, 0::bigint;
    RETURN;
  END IF;

  -- Serialize concurrent consumption on the usage row, then replay by key.
  INSERT INTO public.aigas_trial_quota_usage(trial_id, tenant_id, product_slug, units)
    VALUES (p_trial, p_tenant, p_product, 0)
    ON CONFLICT (trial_id, product_slug) DO NOTHING;
  SELECT u.units INTO v_used
    FROM public.aigas_trial_quota_usage u
    WHERE u.trial_id = p_trial AND u.product_slug = p_product
    FOR UPDATE;

  SELECT r.allowed, r.reason, r.used_after INTO v_previous
    FROM public.aigas_trial_quota_reservations r
    WHERE r.trial_id = p_trial AND r.product_slug = p_product AND r.idempotency_key = p_key;
  IF FOUND THEN
    RETURN QUERY SELECT v_previous.allowed, v_previous.reason, v_previous.used_after,
      v_limit, greatest(v_limit - v_previous.used_after, 0);
    RETURN;
  END IF;

  v_allowed := v_used + p_units <= v_limit;
  v_reason := CASE WHEN v_allowed THEN 'OK' ELSE 'QUOTA_EXCEEDED' END;
  IF v_allowed THEN
    v_used := v_used + p_units;
    UPDATE public.aigas_trial_quota_usage
      SET units = v_used, updated_at = clock_timestamp()
      WHERE trial_id = p_trial AND product_slug = p_product;
  END IF;

  INSERT INTO public.aigas_trial_quota_reservations(
    trial_id, tenant_id, product_slug, idempotency_key, units, allowed, reason, used_after)
    VALUES (p_trial, p_tenant, p_product, p_key, p_units, v_allowed, v_reason, v_used)
    ON CONFLICT (trial_id, product_slug, idempotency_key) DO NOTHING;

  RETURN QUERY SELECT v_allowed, v_reason, v_used, v_limit, greatest(v_limit - v_used, 0);
END;
$$;

-- 5b. Read-only activation gap report for the operator channel. The runtime role
--     has no verb on the quota profile, so this SECURITY DEFINER function is the
--     only way to explain a refusal before the activation guard fires.
CREATE OR REPLACE FUNCTION public.aigas_trial_activation_gaps(p_products text[])
RETURNS TABLE(kind text, product_slug text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT 'READINESS'::text AS kind, p AS product_slug
    FROM unnest(p_products) AS p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.aigas_release_readiness r
      WHERE r.environment = nullif(current_setting('aigas.environment', true), '')
        AND r.release_sha = lower(nullif(current_setting('aigas.release_sha', true), ''))
        AND r.product_slug = p AND r.status = 'PASS'
        AND r.verified_at <= clock_timestamp() AND r.expires_at > clock_timestamp()
    )
  UNION ALL
  SELECT 'QUOTA'::text AS kind, p AS product_slug
    FROM unnest(p_products) AS p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.aigas_trial_quota_limits q
      WHERE q.product_slug = p AND q.effective_from <= clock_timestamp()
        AND (q.expires_at IS NULL OR q.expires_at > clock_timestamp())
    )
$$;

-- 6. Activation guard. Readiness and quota are checked again at the database
--    boundary so a future code path cannot activate without both. It is
--    SECURITY DEFINER because the runtime role intentionally holds no verb on
--    the quota profile; the function only raises or returns NEW.
CREATE OR REPLACE FUNCTION public.aigas_trial_readiness_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  v_environment text;
  v_release text;
  v_missing integer;
BEGIN
  IF NEW.state = 'ACTIVATED' AND OLD.state IS DISTINCT FROM 'ACTIVATED' THEN
    v_environment := nullif(current_setting('aigas.environment', true), '');
    v_release := lower(nullif(current_setting('aigas.release_sha', true), ''));
    IF v_environment IS NULL OR v_environment NOT IN ('local', 'staging', 'production')
      OR v_release IS NULL OR v_release !~ '^[0-9a-f]{7,40}$' THEN
      RAISE EXCEPTION 'Trial activation requires a verified environment and release identity';
    END IF;

    SELECT count(*) INTO v_missing FROM unnest(NEW.requested_products) AS p
      WHERE NOT EXISTS (
        SELECT 1 FROM public.aigas_release_readiness r
        WHERE r.environment = v_environment AND r.release_sha = v_release
          AND r.product_slug = p AND r.status = 'PASS'
          AND r.verified_at <= clock_timestamp() AND r.expires_at > clock_timestamp()
      );
    IF v_missing > 0 THEN
      RAISE EXCEPTION 'Trial activation requires fresh readiness for every requested product (% missing)', v_missing;
    END IF;

    SELECT count(*) INTO v_missing FROM unnest(NEW.requested_products) AS p
      WHERE NOT EXISTS (
        SELECT 1 FROM public.aigas_trial_quota_limits q
        WHERE q.product_slug = p AND q.effective_from <= clock_timestamp()
          AND (q.expires_at IS NULL OR q.expires_at > clock_timestamp())
      );
    IF v_missing > 0 THEN
      RAISE EXCEPTION 'Trial activation requires an approved quota profile for every requested product (% missing)', v_missing;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER aigas_trial_readiness_guard
  BEFORE UPDATE ON public.aigas_trial_requests
  FOR EACH ROW EXECUTE FUNCTION public.aigas_trial_readiness_guard();

-- 7. Entitlement guard replacement: the `0023` version refused any update once the
--    request left ACTIVATED, which made the expiry path impossible. Window and
--    scope stay immutable; only a status change in a terminal state is allowed.
CREATE OR REPLACE FUNCTION public.aigas_trial_entitlement_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE request_row record;
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.trial_id IS DISTINCT FROM OLD.trial_id OR
    NEW.tenant_id IS DISTINCT FROM OLD.tenant_id OR
    NEW.product_slug IS DISTINCT FROM OLD.product_slug OR
    NEW.starts_at IS DISTINCT FROM OLD.starts_at OR
    NEW.ends_at IS DISTINCT FROM OLD.ends_at
  ) THEN
    RAISE EXCEPTION 'Trial entitlement scope and window are immutable';
  END IF;
  SELECT state, activated_at, expires_at INTO request_row
    FROM public.aigas_trial_requests WHERE id = NEW.trial_id AND tenant_id = NEW.tenant_id;
  IF request_row IS NULL THEN
    RAISE EXCEPTION 'Trial request does not exist for this tenant';
  END IF;
  IF TG_OP = 'INSERT' AND request_row.state <> 'ACTIVATED' THEN
    RAISE EXCEPTION 'Trial entitlement requires an ACTIVATED request';
  END IF;
  IF TG_OP = 'UPDATE' AND request_row.state NOT IN ('ACTIVATED', 'EXPIRED', 'CANCELLED', 'CLOSED', 'REJECTED') THEN
    RAISE EXCEPTION 'Trial entitlement requires an ACTIVATED or terminal request';
  END IF;
  IF NEW.starts_at IS DISTINCT FROM request_row.activated_at OR NEW.ends_at IS DISTINCT FROM request_row.expires_at THEN
    RAISE EXCEPTION 'Trial entitlement must match the recorded 48-hour window';
  END IF;
  RETURN NEW;
END;
$$;

-- 8. RLS. Replace the generic tenant-for-all policy on the three `0023` tables.
DO $$
BEGIN
  IF to_regclass('public.aigas_trial_requests') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.aigas_trial_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS aigas_runtime_tenant ON public.aigas_trial_requests';
  END IF;
  IF to_regclass('public.aigas_trial_events') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.aigas_trial_events ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS aigas_runtime_tenant ON public.aigas_trial_events';
  END IF;
  IF to_regclass('public.aigas_trial_entitlements') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.aigas_trial_entitlements ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS aigas_runtime_tenant ON public.aigas_trial_entitlements';
  END IF;
  EXECUTE 'ALTER TABLE public.aigas_trial_operators ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.aigas_release_readiness ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.aigas_trial_quota_limits ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.aigas_trial_quota_usage ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.aigas_trial_quota_reservations ENABLE ROW LEVEL SECURITY';
END $$;

CREATE POLICY aigas_trial_requests_select ON public.aigas_trial_requests
  FOR SELECT TO aigas_runtime
  USING (public.aigas_tenant_scope(tenant_id) OR public.aigas_trial_operator_active());
-- A tenant may create only its own REQUESTED row, and only as a manager. It can
-- never insert a decision, an activation or an APPROVED state.
CREATE POLICY aigas_trial_requests_insert ON public.aigas_trial_requests
  FOR INSERT TO aigas_runtime
  WITH CHECK (
    public.aigas_tenant_scope(tenant_id)
    AND public.aigas_actor_is_manager(tenant_id)
    AND requested_by = public.aigas_actor()
    AND state = 'REQUESTED'
    AND decision_source IS NULL AND decided_by IS NULL AND decided_at IS NULL
    AND activated_at IS NULL AND expires_at IS NULL AND closed_at IS NULL
  );
-- Decisions and activation are operator-only. No tenant-scoped UPDATE policy.
CREATE POLICY aigas_trial_requests_operator_update ON public.aigas_trial_requests
  FOR UPDATE TO aigas_runtime
  USING (public.aigas_trial_operator_active())
  WITH CHECK (public.aigas_trial_operator_active());

CREATE POLICY aigas_trial_events_select ON public.aigas_trial_events
  FOR SELECT TO aigas_runtime
  USING (public.aigas_tenant_scope(tenant_id) OR public.aigas_trial_operator_active());
-- A tenant may append only its own TENANT event, or the SYSTEM expiry event.
-- `actor_source='OPERATOR'` cannot be forged from tenant scope.
CREATE POLICY aigas_trial_events_insert ON public.aigas_trial_events
  FOR INSERT TO aigas_runtime
  WITH CHECK (
    (
      public.aigas_tenant_scope(tenant_id)
      AND (
        (actor_source = 'TENANT' AND actor_user_id = public.aigas_actor())
        OR (actor_source = 'SYSTEM' AND to_state = 'EXPIRED' AND actor_user_id IS NULL)
      )
    )
    OR (
      public.aigas_trial_operator_active()
      AND (
        (actor_source = 'OPERATOR' AND actor_user_id = public.aigas_actor())
        OR (actor_source = 'SYSTEM' AND to_state = 'EXPIRED' AND actor_user_id IS NULL)
      )
    )
  );

CREATE POLICY aigas_trial_entitlements_select ON public.aigas_trial_entitlements
  FOR SELECT TO aigas_runtime
  USING (public.aigas_tenant_scope(tenant_id) OR public.aigas_trial_operator_active());
CREATE POLICY aigas_trial_entitlements_operator_insert ON public.aigas_trial_entitlements
  FOR INSERT TO aigas_runtime
  WITH CHECK (public.aigas_trial_operator_active());
CREATE POLICY aigas_trial_entitlements_operator_update ON public.aigas_trial_entitlements
  FOR UPDATE TO aigas_runtime
  USING (public.aigas_trial_operator_active())
  WITH CHECK (public.aigas_trial_operator_active());

CREATE POLICY aigas_trial_operators_self ON public.aigas_trial_operators
  FOR SELECT TO aigas_runtime
  USING (user_id = public.aigas_actor());
CREATE POLICY aigas_release_readiness_read ON public.aigas_release_readiness
  FOR SELECT TO aigas_runtime
  USING (true);

-- Restrictive client deny on the new tables, matching the 0025 posture. The 0025
-- loop ran before these tables existed, so it is repeated here explicitly.
DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'aigas_trial_operators', 'aigas_release_readiness', 'aigas_trial_quota_limits',
    'aigas_trial_quota_usage', 'aigas_trial_quota_reservations'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY aigas_client_deny ON public.%I AS RESTRICTIVE FOR ALL TO PUBLIC '
      'USING (current_user NOT IN (''authenticated'',''anonymous'',''authenticator'')) '
      'WITH CHECK (current_user NOT IN (''authenticated'',''anonymous'',''authenticator''))', target);
  END LOOP;
END $$;

-- 9. Grants. Read stays read; the only new tenant verb is creating a REQUESTED
--    row. Decisions/activation are column-limited and policy-gated to operators.
GRANT SELECT ON public.aigas_trial_operators TO aigas_runtime;
GRANT SELECT ON public.aigas_release_readiness TO aigas_runtime;
GRANT INSERT (id, tenant_id, requested_by, requested_products, deployment_mode, data_mode,
  business_goal, state) ON public.aigas_trial_requests TO aigas_runtime;
GRANT UPDATE (state, decision_source, decided_by, decided_at, activated_at, expires_at,
  closed_at, reason, version) ON public.aigas_trial_requests TO aigas_runtime;
GRANT INSERT ON public.aigas_trial_entitlements TO aigas_runtime;
GRANT UPDATE (status) ON public.aigas_trial_entitlements TO aigas_runtime;

REVOKE ALL ON public.aigas_trial_operators, public.aigas_release_readiness,
  public.aigas_trial_quota_limits, public.aigas_trial_quota_usage,
  public.aigas_trial_quota_reservations FROM PUBLIC;

DO $$
BEGIN
  IF to_regrole('authenticated') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.aigas_trial_operators, public.aigas_release_readiness, public.aigas_trial_quota_limits, public.aigas_trial_quota_usage, public.aigas_trial_quota_reservations FROM authenticated';
  END IF;
  IF to_regrole('anonymous') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.aigas_trial_operators, public.aigas_release_readiness, public.aigas_trial_quota_limits, public.aigas_trial_quota_usage, public.aigas_trial_quota_reservations FROM anonymous';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.aigas_trial_operator_active() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_trial_tenant_transition(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_trial_consume_quota(uuid, uuid, text, bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aigas_trial_activation_gaps(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aigas_trial_operator_active() TO aigas_runtime;
GRANT EXECUTE ON FUNCTION public.aigas_trial_tenant_transition(uuid, uuid, text, text) TO aigas_runtime;
GRANT EXECUTE ON FUNCTION public.aigas_trial_consume_quota(uuid, uuid, text, bigint, text) TO aigas_runtime;
GRANT EXECUTE ON FUNCTION public.aigas_trial_activation_gaps(text[]) TO aigas_runtime;

DO $$
BEGIN
  IF to_regrole('authenticated') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_trial_operator_active() FROM authenticated';
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_trial_tenant_transition(uuid, uuid, text, text) FROM authenticated';
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_trial_consume_quota(uuid, uuid, text, bigint, text) FROM authenticated';
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_trial_activation_gaps(text[]) FROM authenticated';
  END IF;
  IF to_regrole('anonymous') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_trial_operator_active() FROM anonymous';
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_trial_tenant_transition(uuid, uuid, text, text) FROM anonymous';
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_trial_consume_quota(uuid, uuid, text, bigint, text) FROM anonymous';
    EXECUTE 'REVOKE ALL ON FUNCTION public.aigas_trial_activation_gaps(text[]) FROM anonymous';
  END IF;
END $$;

COMMIT;
