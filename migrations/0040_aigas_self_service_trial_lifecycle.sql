BEGIN;

-- One authoritative window per verified account. Preserve the earliest issued
-- window on upgrade, even if an individual exploration grant was later changed.
ALTER TABLE public.aigas_self_service_trials
  ADD COLUMN started_at timestamptz,
  ADD COLUMN expires_at timestamptz,
  ADD COLUMN status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED')),
  ADD COLUMN activation_source text NOT NULL DEFAULT 'SELF_SERVICE' CHECK (activation_source = 'SELF_SERVICE');
UPDATE public.aigas_self_service_trials t
SET started_at = g.started_at, expires_at = g.started_at + interval '48 hours'
FROM (
  SELECT tenant_id, min(starts_at) AS started_at
  FROM public.aigas_exploration_grants
  GROUP BY tenant_id
) g
WHERE t.tenant_id = g.tenant_id;
ALTER TABLE public.aigas_self_service_trials
  ALTER COLUMN started_at SET NOT NULL,
  ALTER COLUMN expires_at SET NOT NULL,
  ADD CONSTRAINT aigas_self_service_trial_window CHECK (expires_at = started_at + interval '48 hours');

-- Dependency checks cover the deployed synthetic browse paths. No paid provider
-- or operational entitlement is used by this flow.
CREATE FUNCTION public.aigas_self_service_dependencies()
RETURNS TABLE(product_slug text, ready boolean)
LANGUAGE sql STABLE SET search_path = pg_catalog,public AS $$
  WITH required(slug, relations) AS (VALUES
    ('kernel', ARRAY['aigas_tenants','aigas_memberships','aigas_audit_events','aigas_product_access',
      'aigas_exploration_grants','aigas_self_service_trials']),
    ('firewall', ARRAY['aigas_fw_rules','aigas_fw_decisions','aigas_hg_policies']),
    ('ledger', ARRAY['aigas_ld_events']),
    ('human-gate', ARRAY['aigas_hg_policies','aigas_hg_requests','aigas_hg_decisions','aigas_hg_grants',
      'aigas_hg_events','aigas_hg_delegations']),
    ('risk-engine', ARRAY['aigas_re_assets','aigas_re_assessments','aigas_re_asset_revisions','aigas_re_treatment_revisions']),
    ('secure-chat', ARRAY['aigas_sc_requests','aigas_sc_cancellations'])
  )
  SELECT slug,
    (SELECT bool_and(coalesce(has_table_privilege('aigas_runtime', to_regclass('public.' || rel), 'SELECT'),false))
     FROM unnest(relations) AS rel)
    AND (slug <> 'kernel' OR (
      coalesce(has_function_privilege('aigas_runtime', to_regprocedure('public.aigas_lock_member(uuid,uuid)'), 'EXECUTE'),false)
      AND coalesce(has_function_privilege('aigas_runtime', to_regprocedure('public.aigas_exploration_consume(uuid,text)'), 'EXECUTE'),false)
      AND coalesce(has_function_privilege('aigas_runtime', to_regprocedure('public.aigas_self_service_access_state(uuid)'), 'EXECUTE'),false)
      AND coalesce(has_function_privilege('aigas_runtime', to_regprocedure('public.aigas_read_self_service_trial(uuid)'), 'EXECUTE'),false)
    ))
  FROM required
$$;

-- A read may materialize the terminal state and its evidence, once. The time
-- boundary is enforced independently by every protected product operation.
CREATE FUNCTION public.aigas_read_self_service_trial(requested uuid)
RETURNS TABLE(tenant_id uuid, dataset jsonb, started_at timestamptz, expires_at timestamptz,
              status text, activation_source text, server_time timestamptz)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE actor uuid := public.aigas_actor(); owned public.aigas_self_service_trials;
BEGIN
  PERFORM 1 FROM neon_auth."user" WHERE id=actor AND "emailVerified" IS TRUE AND banned IS NOT TRUE FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED' USING ERRCODE='42501';
  END IF;
  SELECT t.* INTO owned FROM public.aigas_self_service_trials t WHERE t.user_id=actor;
  IF requested IS NOT NULL AND requested IS DISTINCT FROM owned.tenant_id THEN
    RAISE EXCEPTION 'TRIAL_WORKSPACE_MISMATCH' USING ERRCODE='42501';
  END IF;
  IF owned.tenant_id IS NULL THEN RETURN; END IF;

  PERFORM 1 FROM public.aigas_lock_member(owned.tenant_id,actor);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRIAL_MEMBERSHIP_REVOKED' USING ERRCODE='42501';
  END IF;

  -- Capture one database time for the status transition and response.
  server_time := clock_timestamp();
  IF owned.status = 'ACTIVE' AND owned.expires_at <= server_time THEN
    UPDATE public.aigas_self_service_trials t SET status='EXPIRED'
    WHERE t.user_id=actor AND t.status='ACTIVE';
    IF FOUND THEN
      INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action,created_at)
      VALUES(gen_random_uuid(),owned.tenant_id,actor,'trial.synthetic.expired',server_time);
      IF NOT FOUND THEN RAISE EXCEPTION 'EVIDENCE_UNAVAILABLE'; END IF;
    END IF;
    owned.status := 'EXPIRED';
  END IF;

  RETURN QUERY SELECT owned.tenant_id, owned.dataset, owned.started_at, owned.expires_at,
                      owned.status, owned.activation_source, server_time;
END
$$;

-- NULL means an ordinary workspace. TRIAL_ACTIVE keeps an authorized trial
-- workspace on the exploration-only product path.
CREATE FUNCTION public.aigas_self_service_access_state(wanted uuid)
RETURNS text
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog,public AS $$
DECLARE owned public.aigas_self_service_trials; checked_at timestamptz;
BEGIN
  IF public.aigas_tenant_scope(wanted) IS NOT TRUE THEN RETURN 'MEMBERSHIP_REQUIRED'; END IF;
  SELECT t.* INTO owned FROM public.aigas_self_service_trials t WHERE t.tenant_id=wanted;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF owned.user_id IS DISTINCT FROM public.aigas_actor() THEN RETURN 'TRIAL_WORKSPACE_MISMATCH'; END IF;
  PERFORM 1 FROM neon_auth."user" WHERE id=owned.user_id AND "emailVerified" IS TRUE AND banned IS NOT TRUE FOR SHARE;
  IF NOT FOUND THEN RETURN 'IDENTITY_NOT_VERIFIED'; END IF;
  checked_at := clock_timestamp();
  IF owned.status <> 'ACTIVE' OR owned.started_at > checked_at OR owned.expires_at <= checked_at THEN
    RETURN 'EXPLORATION_EXPIRED';
  END IF;
  RETURN 'TRIAL_ACTIVE';
END
$$;

-- Replace the legacy zero-argument routine. The default preserves callers while
-- ensuring every activation goes through the new lifecycle and dependency gate.
DROP FUNCTION public.aigas_start_self_service_trial();
CREATE FUNCTION public.aigas_start_self_service_trial(requested uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid := public.aigas_actor(); wanted uuid; asset uuid; started timestamptz;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,34));
 PERFORM 1 FROM neon_auth."user" WHERE id=actor AND "emailVerified" IS TRUE AND banned IS NOT TRUE FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED' USING ERRCODE='42501'; END IF;
 SELECT tenant_id INTO wanted FROM public.aigas_self_service_trials WHERE user_id=actor;
 IF FOUND THEN
  PERFORM public.aigas_read_self_service_trial(requested);
  RETURN wanted;
 END IF;
 IF requested IS NOT NULL THEN
  RAISE EXCEPTION 'TRIAL_WORKSPACE_MISMATCH' USING ERRCODE='42501';
 END IF;
 IF EXISTS (SELECT 1 FROM public.aigas_self_service_dependencies() WHERE NOT ready) THEN
  RAISE EXCEPTION 'TRIAL_DEPENDENCIES_UNAVAILABLE' USING ERRCODE='55000';
 END IF;
 wanted := gen_random_uuid(); started := clock_timestamp();
 INSERT INTO public.aigas_tenants(id,name) VALUES(wanted,'Synthetic Trial');
 INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES(wanted,actor,'MEMBER');
 INSERT INTO public.aigas_self_service_trials(user_id,tenant_id,started_at,expires_at,status,activation_source)
 VALUES(actor,wanted,started,started+interval '48 hours','ACTIVE','SELF_SERVICE');
 asset := gen_random_uuid();
 INSERT INTO public.aigas_re_assets(id,tenant_id,name,owner,purpose,data_classification,created_by)
 VALUES(asset,wanted,'SYNTHETIC — policy assistant','Synthetic team','Synthetic evaluation only; no customer data or provider','PUBLIC',actor);
 INSERT INTO public.aigas_re_asset_revisions(tenant_id,asset_id,asset_version,asset_snapshot,changed_by)
 SELECT wanted,asset,1,jsonb_build_object('name',name,'owner',owner,'purpose',purpose,'data_classification',data_classification),actor
 FROM public.aigas_re_assets WHERE tenant_id=wanted AND id=asset;
 INSERT INTO public.aigas_product_access(tenant_id,product_slug)
 SELECT wanted,unnest(ARRAY['firewall','ledger','human-gate','risk-engine','secure-chat']);
 INSERT INTO public.aigas_exploration_grants(tenant_id,product_slug,starts_at,ends_at,limit_units,approved_by,approval_reference)
 SELECT wanted,unnest(ARRAY['firewall','ledger','human-gate','risk-engine','secure-chat']),started,started+interval '48 hours',100,actor,'SELF_SERVICE_SYNTHETIC_BROWSE_V1';
 INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action,created_at)
 VALUES(gen_random_uuid(),wanted,actor,'trial.synthetic.started',started);
 IF NOT FOUND THEN RAISE EXCEPTION 'EVIDENCE_UNAVAILABLE'; END IF;
 RETURN wanted;
END $$;

CREATE OR REPLACE FUNCTION public.aigas_exploration_consume(wanted uuid, product text)
RETURNS TABLE(allowed boolean, reason text) LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public AS $$
DECLARE g public.aigas_exploration_grants; denial text;
BEGIN
 IF public.aigas_tenant_scope(wanted) IS NOT TRUE THEN
  RETURN QUERY SELECT false,'MEMBERSHIP_REQUIRED'::text; RETURN;
 END IF;
 SELECT * INTO g FROM public.aigas_exploration_grants WHERE tenant_id=wanted AND product_slug=product FOR UPDATE;
 IF NOT FOUND THEN RETURN QUERY SELECT false,'EXPLORATION_NOT_GRANTED'::text; RETURN; END IF;
 denial := public.aigas_self_service_access_state(wanted);
 IF denial IS NOT NULL AND denial <> 'TRIAL_ACTIVE' THEN
  RETURN QUERY SELECT false,denial; RETURN;
 END IF;
 IF denial = 'TRIAL_ACTIVE' AND EXISTS (
  SELECT 1 FROM public.aigas_self_service_dependencies() d
  WHERE d.product_slug IN ('kernel',product) AND NOT d.ready
 ) THEN
  RETURN QUERY SELECT false,'TRIAL_DEPENDENCIES_UNAVAILABLE'::text; RETURN;
 END IF;
 IF g.revoked_at IS NOT NULL OR g.starts_at>clock_timestamp() OR g.ends_at<=clock_timestamp() THEN
  RETURN QUERY SELECT false,'EXPLORATION_EXPIRED'::text; RETURN;
 END IF;
 IF g.used>=g.limit_units THEN RETURN QUERY SELECT false,'EXPLORATION_QUOTA_EXCEEDED'::text; RETURN; END IF;
 UPDATE public.aigas_exploration_grants SET used=used+1 WHERE tenant_id=wanted AND product_slug=product;
 INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action)
 VALUES(gen_random_uuid(),wanted,public.aigas_actor(),'exploration.browse.'||product);
 IF NOT FOUND THEN RAISE EXCEPTION 'EVIDENCE_UNAVAILABLE'; END IF;
 RETURN QUERY SELECT true,'EXPLORATION_ALLOWED'::text;
END $$;

REVOKE ALL ON FUNCTION public.aigas_self_service_dependencies(),
  public.aigas_read_self_service_trial(uuid), public.aigas_self_service_access_state(uuid),
  public.aigas_start_self_service_trial(uuid) FROM PUBLIC;
DO $$
DECLARE client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['authenticated','anonymous','authenticator'] LOOP
    IF to_regrole(client_role) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.aigas_self_service_dependencies(),
        public.aigas_read_self_service_trial(uuid), public.aigas_self_service_access_state(uuid),
        public.aigas_start_self_service_trial(uuid) FROM %I', client_role);
    END IF;
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.aigas_self_service_dependencies(),
  public.aigas_read_self_service_trial(uuid), public.aigas_self_service_access_state(uuid),
  public.aigas_start_self_service_trial(uuid) TO aigas_runtime;

COMMIT;
