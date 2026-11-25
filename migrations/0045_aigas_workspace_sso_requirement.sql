BEGIN;
CREATE TABLE public.aigas_workspace_sso_requirements (
  tenant_id uuid PRIMARY KEY REFERENCES public.aigas_tenants(id) ON DELETE CASCADE
);
ALTER TABLE public.aigas_workspace_sso_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_sso_read ON public.aigas_workspace_sso_requirements
  FOR SELECT TO aigas_runtime USING (public.aigas_tenant_scope(tenant_id));
REVOKE ALL ON public.aigas_workspace_sso_requirements FROM PUBLIC;
GRANT SELECT ON public.aigas_workspace_sso_requirements TO aigas_runtime;
COMMIT;
