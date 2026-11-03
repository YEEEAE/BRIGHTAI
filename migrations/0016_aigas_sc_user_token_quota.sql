-- Local migration only. Review function ownership and runtime EXECUTE grants
-- before applying in any environment. No content or sample data is introduced.
BEGIN;
CREATE FUNCTION public.aigas_sc_usage_window_v2(wanted_tenant uuid, wanted_user uuid)
RETURNS TABLE(
  user_minute bigint,
  tenant_minute bigint,
  user_day bigint,
  tenant_day bigint,
  user_token_charge numeric,
  tenant_token_charge numeric
)
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT
    count(*) FILTER(WHERE user_id=wanted_user AND created_at>now()-interval '1 minute'),
    count(*) FILTER(WHERE created_at>now()-interval '1 minute'),
    count(*) FILTER(WHERE user_id=wanted_user),
    count(*),
    coalesce(sum(coalesce(total_tokens,reserved_tokens)) FILTER(WHERE user_id=wanted_user),0),
    coalesce(sum(coalesce(total_tokens,reserved_tokens)),0)
  FROM public.aigas_sc_requests
  WHERE tenant_id=wanted_tenant AND created_at>now()-interval '24 hours'
    AND wanted_tenant=nullif(current_setting('aigas.sc_tenant_id',true),'')::uuid
    AND wanted_user=nullif(current_setting('aigas.sc_user_id',true),'')::uuid
    AND EXISTS(
      SELECT 1 FROM public.aigas_memberships
      WHERE tenant_id=wanted_tenant AND user_id=wanted_user
    )
$$;
REVOKE ALL ON FUNCTION public.aigas_sc_usage_window_v2(uuid,uuid) FROM PUBLIC;
COMMIT;
