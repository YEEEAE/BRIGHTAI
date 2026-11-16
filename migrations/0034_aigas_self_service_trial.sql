-- Isolated staging first. No provider, paid access, manager role or renewal.
BEGIN;
CREATE TABLE public.aigas_self_service_trials (
 user_id uuid PRIMARY KEY REFERENCES neon_auth."user"(id),
 tenant_id uuid UNIQUE NOT NULL REFERENCES public.aigas_tenants(id),
 dataset jsonb NOT NULL DEFAULT '{"classification":"SYNTHETIC","organization":"Example Laboratory","asset":"Synthetic policy assistant","scenario":"No customer data or external provider"}'::jsonb
);
ALTER TABLE public.aigas_self_service_trials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.aigas_self_service_trials FROM PUBLIC;
GRANT SELECT ON public.aigas_self_service_trials TO aigas_runtime;
CREATE POLICY own_trial ON public.aigas_self_service_trials FOR SELECT TO aigas_runtime
 USING(user_id=public.aigas_actor() AND public.aigas_tenant_scope(tenant_id));

-- No caller-supplied actor, tenant, role, quota, duration or readiness.
CREATE FUNCTION public.aigas_start_self_service_trial()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE actor uuid := public.aigas_actor(); wanted uuid; asset uuid; started timestamptz;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,34));
 PERFORM 1 FROM neon_auth."user" WHERE id=actor AND "emailVerified" IS TRUE AND banned IS NOT TRUE FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED' USING ERRCODE='42501'; END IF;
 SELECT tenant_id INTO wanted FROM public.aigas_self_service_trials WHERE user_id=actor;
 IF FOUND THEN
  IF NOT public.aigas_is_tenant_member(wanted) THEN RAISE EXCEPTION 'TRIAL_MEMBERSHIP_REVOKED' USING ERRCODE='42501'; END IF;
  RETURN wanted;
 END IF;
 wanted := gen_random_uuid(); started := clock_timestamp();
 INSERT INTO public.aigas_tenants(id,name) VALUES(wanted,'Synthetic Trial');
 INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES(wanted,actor,'MEMBER');
 INSERT INTO public.aigas_self_service_trials(user_id,tenant_id) VALUES(actor,wanted);
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
 INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action)
 VALUES(gen_random_uuid(),wanted,actor,'trial.synthetic.started');
 IF NOT FOUND THEN RAISE EXCEPTION 'EVIDENCE_UNAVAILABLE'; END IF;
 RETURN wanted;
END $$;
REVOKE ALL ON FUNCTION public.aigas_start_self_service_trial() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aigas_start_self_service_trial() TO aigas_runtime;
CREATE OR REPLACE FUNCTION public.aigas_exploration_consume(wanted uuid, product text)
RETURNS TABLE(allowed boolean, reason text) LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public AS $$
DECLARE g public.aigas_exploration_grants;
BEGIN
 IF NOT public.aigas_tenant_scope(wanted) THEN
  RETURN QUERY SELECT false,'MEMBERSHIP_REQUIRED'::text; RETURN;
 END IF;
 IF EXISTS(SELECT 1 FROM public.aigas_self_service_trials WHERE tenant_id=wanted)
 AND NOT EXISTS(SELECT 1 FROM neon_auth."user" WHERE id=public.aigas_actor() AND "emailVerified" IS TRUE AND banned IS NOT TRUE) THEN
  RETURN QUERY SELECT false,'IDENTITY_NOT_VERIFIED'::text; RETURN;
 END IF;
 SELECT * INTO g FROM public.aigas_exploration_grants WHERE tenant_id=wanted AND product_slug=product FOR UPDATE;
 IF NOT FOUND THEN RETURN QUERY SELECT false,'EXPLORATION_NOT_GRANTED'::text; RETURN; END IF;
 IF g.revoked_at IS NOT NULL OR g.starts_at>clock_timestamp() OR g.ends_at<=clock_timestamp() THEN
  RETURN QUERY SELECT false,'EXPLORATION_EXPIRED'::text; RETURN;
 END IF;
 IF g.used>=g.limit_units THEN RETURN QUERY SELECT false,'EXPLORATION_QUOTA_EXCEEDED'::text; RETURN; END IF;
 UPDATE public.aigas_exploration_grants SET used=used+1 WHERE tenant_id=wanted AND product_slug=product;
 INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action)
 VALUES(gen_random_uuid(),wanted,public.aigas_actor(),'exploration.browse.'||product);
 RETURN QUERY SELECT true,'EXPLORATION_ALLOWED'::text;
END $$;
COMMIT;
