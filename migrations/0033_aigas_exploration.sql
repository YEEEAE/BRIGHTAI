-- Local draft: separate internal exploration; never a product readiness receipt.
BEGIN;
CREATE TABLE public.aigas_exploration_grants (
 tenant_id uuid NOT NULL REFERENCES public.aigas_tenants(id),
 product_slug text NOT NULL CHECK(product_slug IN ('firewall','ledger','human-gate','risk-engine','secure-chat')),
 starts_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 ends_at timestamptz NOT NULL,
 limit_units integer NOT NULL CHECK(limit_units BETWEEN 1 AND 10000),
 used integer NOT NULL DEFAULT 0 CHECK(used>=0 AND used<=limit_units),
 approved_by uuid NOT NULL REFERENCES neon_auth."user"(id),
 approval_reference text NOT NULL CHECK(length(btrim(approval_reference)) BETWEEN 10 AND 180),
 revoked_at timestamptz,
 PRIMARY KEY(tenant_id,product_slug),
 CHECK(ends_at=starts_at+interval '48 hours')
);
ALTER TABLE public.aigas_exploration_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.aigas_exploration_grants FROM PUBLIC;
GRANT SELECT ON public.aigas_exploration_grants TO aigas_runtime;
CREATE POLICY exploration_read ON public.aigas_exploration_grants FOR SELECT TO aigas_runtime
 USING(public.aigas_tenant_scope(tenant_id));
-- Only a fixed browse capability is exposed. Caller scope is established by the
-- authenticated server, and membership is rechecked by aigas_tenant_scope.
CREATE FUNCTION public.aigas_exploration_consume(wanted uuid, product text)
RETURNS TABLE(allowed boolean, reason text) LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public AS $$
DECLARE g public.aigas_exploration_grants;
BEGIN
 IF NOT public.aigas_tenant_scope(wanted) THEN
  RETURN QUERY SELECT false,'MEMBERSHIP_REQUIRED'::text; RETURN;
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
REVOKE ALL ON FUNCTION public.aigas_exploration_consume(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aigas_exploration_consume(uuid,text) TO aigas_runtime;
DO $$ BEGIN
 IF to_regrole('authenticated') IS NOT NULL THEN
  REVOKE ALL ON public.aigas_exploration_grants FROM authenticated;
  REVOKE ALL ON FUNCTION public.aigas_exploration_consume(uuid,text) FROM authenticated;
 END IF;
 IF to_regrole('anonymous') IS NOT NULL THEN
  REVOKE ALL ON public.aigas_exploration_grants FROM anonymous;
  REVOKE ALL ON FUNCTION public.aigas_exploration_consume(uuid,text) FROM anonymous;
 END IF;
END $$;
COMMIT;
