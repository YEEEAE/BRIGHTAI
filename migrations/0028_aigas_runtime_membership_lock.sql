-- LOCAL ONLY: runtime row locks must not require permission to mutate self membership.
-- Requires 0025. Apply as table owner on an approved isolated target only.
BEGIN;
CREATE FUNCTION public.aigas_lock_member(wanted_tenant uuid, wanted_user uuid)
RETURNS TABLE(role text, name text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  actor uuid := public.aigas_actor();
  selected_tenant uuid := nullif(current_setting('aigas.tenant_id', true), '')::uuid;
BEGIN
  -- Actor-only discovery may lock the caller's own membership before tenant scope.
  -- Other members require the exact verified tenant scope. No foreign-tenant read.
  IF actor IS NULL OR wanted_tenant IS NULL OR wanted_user IS NULL
     OR (selected_tenant IS NULL AND wanted_user <> actor)
     OR (selected_tenant IS NOT NULL AND selected_tenant <> wanted_tenant)
     OR NOT EXISTS (
       SELECT 1 FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id
       WHERE m.tenant_id=wanted_tenant AND m.user_id=actor AND u.banned IS NOT TRUE
     ) THEN RETURN; END IF;
  -- Lock both rows to preserve revocation/banning serialization. No UPDATE grant,
  -- policy expansion, or DML is exposed to the runtime caller.
  RETURN QUERY SELECT m.role, u.name FROM public.aigas_memberships m
    JOIN neon_auth."user" u ON u.id=m.user_id
    WHERE m.tenant_id=wanted_tenant AND m.user_id=wanted_user AND u.banned IS NOT TRUE
    FOR SHARE OF m,u;
END;
$$;
REVOKE ALL ON FUNCTION public.aigas_lock_member(uuid,uuid) FROM PUBLIC, authenticated, anonymous;
GRANT EXECUTE ON FUNCTION public.aigas_lock_member(uuid,uuid) TO aigas_runtime;
-- Read-only entitlement/evidence rows still need revocation serialization.
-- Lock through owner functions rather than granting UPDATE on operator-only tables.
CREATE FUNCTION public.aigas_locked_product_grants(wanted uuid)
RETURNS SETOF public.aigas_product_grants
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT g.* FROM public.aigas_product_grants g
 WHERE g.tenant_id=wanted AND public.aigas_tenant_scope(wanted)
 FOR SHARE OF g
$$;
CREATE FUNCTION public.aigas_locked_evidence_requirements(wanted uuid)
RETURNS SETOF public.aigas_ld_evidence_requirements
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT r.* FROM public.aigas_ld_evidence_requirements r
 WHERE r.tenant_id=wanted AND public.aigas_tenant_scope(wanted)
 FOR SHARE OF r
$$;
REVOKE ALL ON FUNCTION public.aigas_locked_product_grants(uuid),public.aigas_locked_evidence_requirements(uuid) FROM PUBLIC,authenticated,anonymous;
GRANT EXECUTE ON FUNCTION public.aigas_locked_product_grants(uuid),public.aigas_locked_evidence_requirements(uuid) TO aigas_runtime;
COMMIT;
