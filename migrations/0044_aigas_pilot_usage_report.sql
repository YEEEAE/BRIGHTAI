BEGIN;
GRANT SELECT (tenant_id, product_slug, units, allowed, created_at)
  ON public.aigas_trial_quota_reservations TO aigas_runtime;
CREATE POLICY pilot_admin_read ON public.aigas_trial_quota_reservations
  FOR SELECT TO aigas_runtime USING (
    public.aigas_tenant_scope(tenant_id) AND EXISTS (
      SELECT 1 FROM public.aigas_memberships m
      WHERE m.tenant_id = aigas_trial_quota_reservations.tenant_id
        AND m.user_id = public.aigas_actor() AND m.role IN ('OWNER', 'ADMIN')
    )
  );
COMMIT;
