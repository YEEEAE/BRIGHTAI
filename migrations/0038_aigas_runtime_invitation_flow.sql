-- The authenticated server sets aigas.user_id from the verified bearer.
-- Listing an invitation grants no tenant scope or membership.
BEGIN;
CREATE FUNCTION public.aigas_list_workspace_invitations()
RETURNS TABLE(id uuid, name text, expires_at timestamptz, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT i.id, t.name::text, i."expiresAt",
    CASE WHEN i."expiresAt" IS NULL OR i."expiresAt" <= now() THEN 'expired'
         WHEN i.status IN ('pending','accepted') AND
           (COALESCE(km.role,'') NOT IN ('OWNER','ADMIN') OR COALESCE(nm.role,'') NOT IN ('owner','admin')
             OR inviter.id IS NULL OR inviter.banned IS TRUE) THEN 'inviter_unavailable'
         ELSE i.status END::text
  FROM public.aigas_member_invitations k
  JOIN neon_auth.invitation i ON i.id=k.invitation_id
  JOIN public.aigas_auth_organizations o ON o.tenant_id=k.tenant_id AND o.organization_id=i."organizationId"
  JOIN public.aigas_tenants t ON t.id=k.tenant_id
  JOIN neon_auth."user" u ON u.id=public.aigas_actor() AND lower(u.email)=lower(i.email)
  LEFT JOIN public.aigas_memberships km ON km.tenant_id=k.tenant_id AND km.user_id=k.invited_by
  LEFT JOIN neon_auth."user" inviter ON inviter.id=k.invited_by
  LEFT JOIN neon_auth.member nm ON nm."organizationId"=i."organizationId" AND nm."userId"=k.invited_by
  WHERE u."emailVerified" IS TRUE AND u.banned IS NOT TRUE AND k.accepted_at IS NULL
    AND i.role='member' AND i."inviterId"=k.invited_by AND i.status IN ('pending','accepted','rejected','canceled')
  ORDER BY k.created_at DESC, i.id LIMIT 30
$$;

CREATE FUNCTION public.aigas_accept_workspace_invitation_v2(p_invitation_id uuid)
RETURNS TABLE(workspace_id uuid, membership_role text, idempotent boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := public.aigas_actor(); registration public.aigas_member_invitations%ROWTYPE; account neon_auth."user"%ROWTYPE; invitation neon_auth.invitation%ROWTYPE; actor_role text;
BEGIN
  SELECT * INTO account FROM neon_auth."user" u WHERE u.id=actor AND u.banned IS NOT TRUE AND u."emailVerified" IS TRUE FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verified active identity required' USING ERRCODE='42501', CONSTRAINT='IDENTITY_NOT_VERIFIED'; END IF;
  SELECT * INTO registration FROM public.aigas_member_invitations WHERE invitation_id=p_invitation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='42501', CONSTRAINT='INVALID_INVITATION'; END IF;
  SELECT * INTO invitation FROM neon_auth.invitation WHERE id=p_invitation_id FOR SHARE;
  IF NOT FOUND OR lower(invitation.email) IS DISTINCT FROM lower(account.email) THEN
    RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='42501', CONSTRAINT='INVALID_INVITATION';
  END IF;
  IF registration.accepted_by IS NOT NULL THEN
    IF registration.accepted_by IS DISTINCT FROM actor THEN
      RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='42501', CONSTRAINT='INVALID_INVITATION';
    END IF;
    SELECT m.role INTO actor_role FROM public.aigas_memberships m
      WHERE m.tenant_id=registration.tenant_id AND m.user_id=actor FOR SHARE;
    IF FOUND THEN
      RETURN QUERY SELECT registration.tenant_id, actor_role, true;
      RETURN;
    END IF;
    RAISE EXCEPTION 'Invitation consumed' USING ERRCODE='42501', CONSTRAINT='INVITATION_ALREADY_CONSUMED';
  END IF;
  IF invitation.role IS DISTINCT FROM 'member' OR invitation."inviterId" IS DISTINCT FROM registration.invited_by THEN
    RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='42501', CONSTRAINT='INVALID_INVITATION';
  END IF;
  PERFORM 1 FROM public.aigas_auth_organizations o
    WHERE o.tenant_id=registration.tenant_id AND o.organization_id=invitation."organizationId" FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='42501', CONSTRAINT='INVALID_INVITATION'; END IF;
  IF invitation."expiresAt" IS NULL OR invitation."expiresAt" <= clock_timestamp() THEN
    RAISE EXCEPTION 'Invitation expired' USING ERRCODE='42501', CONSTRAINT='INVITATION_EXPIRED';
  END IF;
  IF invitation.status IN ('canceled','rejected','expired') THEN
    RAISE EXCEPTION 'Invitation revoked' USING ERRCODE='42501', CONSTRAINT='INVITATION_REVOKED';
  END IF;
  PERFORM 1 FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id
    WHERE m.tenant_id=registration.tenant_id AND m.user_id=registration.invited_by AND m.role IN ('OWNER','ADMIN') AND u.banned IS NOT TRUE FOR SHARE OF m,u;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inviter authority revoked' USING ERRCODE='42501', CONSTRAINT='INVITER_AUTHORITY_REVOKED'; END IF;
  PERFORM 1 FROM neon_auth.member WHERE "organizationId"=invitation."organizationId" AND "userId"=registration.invited_by AND role IN ('owner','admin') FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inviter authority revoked' USING ERRCODE='42501', CONSTRAINT='INVITER_AUTHORITY_REVOKED'; END IF;
  IF invitation.status IS DISTINCT FROM 'accepted' THEN
    RAISE EXCEPTION 'Provider acceptance required' USING ERRCODE='42501', CONSTRAINT='INVITATION_NOT_ACCEPTED';
  END IF;
  PERFORM 1 FROM neon_auth.member WHERE "organizationId"=invitation."organizationId" AND "userId"=actor FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Provider acceptance required' USING ERRCODE='42501', CONSTRAINT='INVITATION_NOT_ACCEPTED'; END IF;
  INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES(registration.tenant_id,actor,'MEMBER') ON CONFLICT DO NOTHING;
  UPDATE public.aigas_member_invitations SET accepted_by=actor,accepted_at=now() WHERE invitation_id=p_invitation_id;
  SELECT m.role INTO STRICT actor_role FROM public.aigas_memberships m
    WHERE m.tenant_id=registration.tenant_id AND m.user_id=actor FOR SHARE;
  INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action,correlation_id)
    VALUES(gen_random_uuid(),registration.tenant_id,actor,'kernel.invitation.accepted',gen_random_uuid());
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation acceptance evidence unavailable'; END IF;
  RETURN QUERY SELECT registration.tenant_id, actor_role, false;
END $$;
-- Keep the UUID-returning contract for existing callers.
CREATE OR REPLACE FUNCTION public.aigas_accept_workspace_invitation(p_invitation_id uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT workspace_id FROM public.aigas_accept_workspace_invitation_v2(p_invitation_id)
$$;

REVOKE ALL ON FUNCTION public.aigas_list_workspace_invitations(), public.aigas_accept_workspace_invitation_v2(uuid) FROM PUBLIC;
DO $$
DECLARE client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['authenticated','anonymous'] LOOP
    IF to_regrole(client_role) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.aigas_list_workspace_invitations(), public.aigas_accept_workspace_invitation_v2(uuid) FROM %I', client_role);
    END IF;
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.aigas_list_workspace_invitations(), public.aigas_accept_workspace_invitation_v2(uuid) TO aigas_runtime;
COMMIT;
