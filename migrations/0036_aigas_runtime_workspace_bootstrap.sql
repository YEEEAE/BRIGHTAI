-- Trust boundary: only the server sets aigas.user_id from a verified token.
BEGIN;
CREATE FUNCTION public.aigas_bootstrap_workspace(p_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := public.aigas_actor(); workspace uuid := gen_random_uuid();
BEGIN
  PERFORM 1 FROM neon_auth."user" u WHERE u.id=actor AND u.banned IS NOT TRUE FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active identity required' USING ERRCODE='42501'; END IF;
  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 2 AND 100 THEN
    RAISE EXCEPTION 'Invalid workspace name' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,0));
  IF (SELECT count(*) FROM public.aigas_memberships WHERE user_id=actor AND role='OWNER') >= 10 THEN
    RAISE EXCEPTION 'Workspace limit' USING ERRCODE='54000';
  END IF;
  INSERT INTO public.aigas_tenants(id,name) VALUES(workspace,btrim(p_name));
  INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES(workspace,actor,'OWNER');
  INSERT INTO public.aigas_product_access(tenant_id,product_slug)
    SELECT workspace, unnest(ARRAY['firewall','ledger','human-gate','risk-engine','secure-chat']);
  INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action)
    VALUES(gen_random_uuid(),workspace,actor,'workspace.created');
  RETURN workspace;
END $$;

CREATE FUNCTION public.aigas_accept_workspace_invitation(p_invitation_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor uuid := public.aigas_actor(); registration public.aigas_member_invitations%ROWTYPE; account neon_auth."user"%ROWTYPE; invitation neon_auth.invitation%ROWTYPE;
BEGIN
  SELECT * INTO account FROM neon_auth."user" u WHERE u.id=actor AND u.banned IS NOT TRUE AND u."emailVerified" IS TRUE FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Verified active identity required' USING ERRCODE='42501'; END IF;
  SELECT * INTO registration FROM public.aigas_member_invitations WHERE invitation_id=p_invitation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='42501'; END IF;
  SELECT * INTO invitation FROM neon_auth.invitation WHERE id=p_invitation_id FOR SHARE;
  IF NOT FOUND OR lower(invitation.email) IS DISTINCT FROM lower(account.email) THEN
    RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='42501';
  END IF;
  IF registration.accepted_by IS NOT NULL THEN
    IF registration.accepted_by=actor AND EXISTS (SELECT 1 FROM public.aigas_memberships WHERE tenant_id=registration.tenant_id AND user_id=actor) THEN RETURN registration.tenant_id; END IF;
    RAISE EXCEPTION 'Invitation consumed' USING ERRCODE='42501';
  END IF;
  IF invitation.status IS DISTINCT FROM 'accepted' OR invitation.role IS DISTINCT FROM 'member'
     OR invitation."expiresAt" IS NULL OR invitation."expiresAt" <= now()
     OR invitation."inviterId" IS DISTINCT FROM registration.invited_by
     OR NOT EXISTS (SELECT 1 FROM public.aigas_auth_organizations WHERE tenant_id=registration.tenant_id AND organization_id=invitation."organizationId") THEN
    RAISE EXCEPTION 'Invalid invitation' USING ERRCODE='42501';
  END IF;
  PERFORM 1 FROM public.aigas_memberships m JOIN neon_auth."user" u ON u.id=m.user_id
    WHERE m.tenant_id=registration.tenant_id AND m.user_id=registration.invited_by AND m.role IN ('OWNER','ADMIN') AND u.banned IS NOT TRUE FOR SHARE OF m,u;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inviter authority revoked' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM neon_auth.member WHERE "organizationId"=invitation."organizationId" AND "userId"=registration.invited_by AND role IN ('owner','admin') FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inviter authority revoked' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM neon_auth.member WHERE "organizationId"=invitation."organizationId" AND "userId"=actor FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Provider acceptance required' USING ERRCODE='42501'; END IF;
  INSERT INTO public.aigas_memberships(tenant_id,user_id,role) VALUES(registration.tenant_id,actor,'MEMBER') ON CONFLICT DO NOTHING;
  UPDATE public.aigas_member_invitations SET accepted_by=actor,accepted_at=now() WHERE invitation_id=p_invitation_id;
  INSERT INTO public.aigas_audit_events(id,tenant_id,actor_user_id,action) VALUES(gen_random_uuid(),registration.tenant_id,actor,'kernel.invitation.accepted');
  RETURN registration.tenant_id;
END $$;
REVOKE ALL ON FUNCTION public.aigas_bootstrap_workspace(text), public.aigas_accept_workspace_invitation(uuid) FROM PUBLIC;
DO $$
DECLARE client_role text;
BEGIN
  FOREACH client_role IN ARRAY ARRAY['authenticated','anonymous'] LOOP
    IF to_regrole(client_role) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.aigas_bootstrap_workspace(text), public.aigas_accept_workspace_invitation(uuid) FROM %I', client_role);
    END IF;
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.aigas_bootstrap_workspace(text), public.aigas_accept_workspace_invitation(uuid) TO aigas_runtime;
COMMIT;
